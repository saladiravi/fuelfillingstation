const pool = require('../db/db');
const moment = require('moment');


exports.getPumpDetailsbydate = async (req, res) => {
  try {
    const { date, operator_name } = req.query;

    const operatorName = parseInt(operator_name, 10);

    if (isNaN(operatorName)) {
      return res.status(400).json({ error: 'Invalid operator_name. It must be a number.' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date is required.' });
    }


    // Check if data for the selected date and operator already exists
    const checkQuery = `
  SELECT ps.*
  FROM attendence a
  INNER JOIN pump_sales ps ON ps.attendence_id = a.attendence_id
  WHERE a.date::date = $1 
    AND a.operator_name = $2
   
    AND ps.status = 1; -- Check if status is 1 in pump_sales
`;

    const checkResult = await pool.query(checkQuery, [date, operatorName]);

    if (checkResult.rows.length > 0) {
      return res.status(200).json({
        message: 'Data already added for the selected date, operator, and shift.',
        data: checkResult.rows
      });
    }

    const query = `
      SELECT 
        ps.*,
        COALESCE(a."pumpNumber", 'Not Assigned') AS pumpNumber,
        COALESCE(a.operatorshift, 'Unknown') AS operatorshift,
        e."employeeName" AS operator_name,
        ps."cmr",
        ps."bay_side",
        ps."fuel_type"
      FROM 
        attendence a
      INNER JOIN 
        pump_sales ps ON ps.attendence_id = a.attendence_id
      INNER JOIN 
        employees e ON e.employee_id = a.operator_name
      WHERE
        a.date::date = $1 AND a.operator_name = $2;
    `;


    const result = await pool.query(query, [date, operatorName]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found for the given date and operator.' });
    }

    // Process rows to fetch the correct OMR value
    const processedRows = await Promise.all(
      result.rows.map(async (row) => {
        if (row.operatorshift === 'A') {
          // Fetch the CMR value from the previous day's B shift
          const prevShiftQuery = `
            SELECT ps."cmr"
            FROM pump_sales ps
            INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
            WHERE 
              a.date::date = $1::date - INTERVAL '1 day'
              AND a.operatorshift = 'B'
              AND ps.bay_side = $2
              AND ps.fuel_type = $3;
          `;
          const prevShiftResult = await pool.query(prevShiftQuery, [date, row.bay_side, row.fuel_type]);
          row.omr = prevShiftResult.rows.length > 0 ? prevShiftResult.rows[0].cmr : null;
        } else if (row.operatorshift === 'B') {

          const sameDayShiftQuery = `
          SELECT ps."cmr"
          FROM pump_sales ps
          INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
          WHERE 
            a.date::date = $1
            AND a.operatorshift = 'A'
            AND ps.bay_side = $2
            AND ps.fuel_type = $3;
        `;
          const sameDayShiftResult = await pool.query(sameDayShiftQuery, [date, row.bay_side, row.fuel_type]);
          row.omr = sameDayShiftResult.rows.length > 0 ? sameDayShiftResult.rows[0].cmr : null;

        } else {
          row.omr = null;
        }

        const columnName = row.fuel_type.toLowerCase(); // 'ms', 'hsd', or 'speed'
        if (!['ms', 'hsd', 'speed', 'cng'].includes(columnName)) {
          row.retail_price = null;
        } else {
          const rspQuery = `
            SELECT rsp.${columnName} AS price
            FROM retailsellingprice rsp
            WHERE rsp.created_at::date = $1::date;
          `;
          const rspResult = await pool.query(rspQuery, [date]);
          row.retail_price = rspResult.rows.length > 0 ? rspResult.rows[0].price : null;
        }

        return row;
      })
    );

    res.status(200).json(processedRows);
  } catch (err) {
    console.error('Error fetching pump details:', err.stack);
    res.status(500).json({ error: 'Failed to fetch pump details' });
  }
};



exports.addPumpSales = async (req, res) => {
  try {
    const pumpSalesUpdates = req.body;

    if (!Array.isArray(pumpSalesUpdates) || pumpSalesUpdates.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Request body should be a non-empty array.',
      });
    }

    for (const pumpSale of pumpSalesUpdates) {
      const { pump_sale_id, attendence_id, cmr, omr, res_id, amount, sale } = pumpSale;

      
      if (!attendence_id || !pump_sale_id) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Both attendence_id and pump_sale_id are required for updates.',
        });
      }

      const fields = [];
      const values = [];
      let index = 1;

      
      if (cmr !== undefined) {
        fields.push(`"cmr" = $${index++}`);
        values.push(cmr);
      }
      if (omr !== undefined) {
        fields.push(`"omr" = $${index++}`);
        values.push(omr);
      }
      if (res_id !== undefined) {
        fields.push(`"res_id" = $${index++}`);
        values.push(res_id);
      }
      if (amount !== undefined) {
        fields.push(`"amount" = $${index++}`);
        values.push(amount);
      }
      if (sale !== undefined) {
        fields.push(`"sale" = $${index++}`);
        values.push(sale);
      }

      // Add default status field
      fields.push(`"status" = $${index++}`);
      values.push(1);

      // Ensure there are fields to update
      if (fields.length === 0) {
        return res.status(400).json({
          statusCode: 400,
          message: `No fields provided to update for pump_sale_id ${pump_sale_id}.`,
        });
      }

      // Add pump_sale_id for WHERE clause
      values.push(pump_sale_id);

      const query = `
        UPDATE pump_sales
        SET ${fields.join(', ')}
        WHERE "pump_sale_id" = $${index}
        RETURNING *;
      `;

      const result = await pool.query(query, values);
 
      if (result.rowCount === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: `No pump sales record found with pump_sale_id ${pump_sale_id}.`,
        });
      }
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Pump sales updated successfully for all records.',
    });
  } catch (err) {
    console.error('Error updating pump sales:', err);
    res.status(500).json({
      statusCode: 500,
      error: 'Failed to update pump sales. Please try again later.',
    });
  }
};




// exports.addPumpSales = async (req, res) => {
//   try {
//     const {
//       attendence_id,
//       pump_sale_amount,
//       shift_sales_amount,
//       dm_amount,
//       advance_amount,
//       credit_amount,
//       total_online_payment_amount,
//       pumpSales,
//       cash_notes,
//       cash_notes_advance,
//       credit_data,
//       online_payments,
//     } = req.body;

//     if (!attendence_id) {
//       return res.status(400).json({
//         statuscode: 400,
//         message: "Attendance ID is required",
//       });
//     }

//     const client = await pool.connect();
//     try {
//       await client.query("BEGIN");

//       // Check if the attendance_id already exists in pumpsales_shift_data
//       const existingShiftQuery = `SELECT pumpsale_shift_id FROM pumpsales_shift_data WHERE attendence_id = $1`;
//       const existingShift = await client.query(existingShiftQuery, [attendence_id]);
//       let pumpsale_shift_id;

//       if (existingShift.rows.length > 0) {
//         await client.query("ROLLBACK");
//         return res.status(404).json({
//           statuscode: 404,
//           message: "Already data added to that field",
//         });
//       }

//       // Insert new shift sales data
//       const shiftQuery = `
//         INSERT INTO pumpsales_shift_data (
//           attendence_id, pump_sale_amount, shift_sales_amount, dm_amount, advance_amount, credit_amount, total_online_payment_amount,
//           pump_sale_2000, pump_sale_500, pump_sale_200, pump_sale_100, pump_sale_50, 
//           pump_sale_20, pump_sale_10, pump_sale_5, pump_sale_2, pump_sale_1,
//           advance_2000, advance_500, advance_200, advance_100, advance_50, 
//           advance_20, advance_10, advance_5, advance_2, advance_1
//         ) VALUES (
//           $1, $2, $3, $4, $5, $6, $7,
//           $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
//           $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
//         ) RETURNING pumpsale_shift_id;
//       `;

//       const shiftValues = [
//         attendence_id,
//         pump_sale_amount || "0",
//         shift_sales_amount || "0",
//         dm_amount || "0",
//         advance_amount || "0",
//         credit_amount || "0",
//         total_online_payment_amount || "0",
//         cash_notes?.["pump_sale_2000"] || "0",
//         cash_notes?.["pump_sale_500"] || "0",
//         cash_notes?.["pump_sale_200"] || "0",
//         cash_notes?.["pump_sale_100"] || "0",
//         cash_notes?.["pump_sale_50"] || "0",
//         cash_notes?.["pump_sale_20"] || "0",
//         cash_notes?.["pump_sale_10"] || "0",
//         cash_notes?.["pump_sale_5"] || "0",
//         cash_notes?.["pump_sale_2"] || "0",
//         cash_notes?.["pump_sale_1"] || "0",
//         cash_notes_advance?.["advance_2000"] || "0",
//         cash_notes_advance?.["advance_500"] || "0",
//         cash_notes_advance?.["advance_200"] || "0",
//         cash_notes_advance?.["advance_100"] || "0",
//         cash_notes_advance?.["advance_50"] || "0",
//         cash_notes_advance?.["advance_20"] || "0",
//         cash_notes_advance?.["advance_10"] || "0",
//         cash_notes_advance?.["advance_5"] || "0",
//         cash_notes_advance?.["advance_2"] || "0",
//         cash_notes_advance?.["advance_1"] || "0",
//       ];

//       const shiftResult = await client.query(shiftQuery, shiftValues);
//       pumpsale_shift_id = shiftResult.rows[0].pumpsale_shift_id;

//       // Update pump sales data
//       if (Array.isArray(pumpSales)) {
//         for (const pumpSale of pumpSales) {
//           const { pump_sale_id, fuel_type, cmr, omr, amount, sale, guns ,res_id} = pumpSale;
//           if (!pump_sale_id) continue;

//           const updateQuery = `
//             UPDATE pump_sales
//             SET cmr = $1, omr = $2, amount = $3, sale = $4, fuel_type = $5, guns = $6,res_id=$7
//             WHERE pump_sale_id = $8;
//           `;
//           await client.query(updateQuery, [cmr, omr, amount, sale, fuel_type, guns,res_id, pump_sale_id]);
//         }
//       }

//       // Validate and process uploaded files
//       const billRecipts = Array.isArray(req.files) ? req.files.map(file => `/uploads/${file.filename}`) : [];
      
//       // Attach the first uploaded file to credit_data (assuming one file per entry)
//       if (Array.isArray(credit_data)) {
//         credit_data.forEach((credit, index) => {
//           credit.bill_recipt = billRecipts[index] || null;
//         });
//       }
//        // Insert credit data
//       if (Array.isArray(credit_data)) {
//         for (const credit of credit_data) {
//           const { bill_no, customer_name, product, quantity, rsp,cost, bill_recipt } = credit;

//           const creditQuery = `
//             INSERT INTO credit_data (bill_no, customer_name, product, quantity, rsp,cost,  bill_recipt,pumpsale_shift_id)
//             VALUES ($1, $2, $3, $4, $5, $6, $7,$8);
//           `;
//           await client.query(creditQuery, [bill_no, customer_name, product, quantity, rsp, cost,bill_recipt, pumpsale_shift_id]);
//         }
//       }
 
//       // Insert online payment data
//       if (Array.isArray(online_payments)) {
//         for (const payment of online_payments) {
//           const { online_payment_amount, online_payment_type } = payment;

//           const paymentQuery = `
//             INSERT INTO online_payment_data (online_payment_amount, online_payment_type, pumpsale_shift_id)
//             VALUES ($1, $2, $3);
//           `;
//           await client.query(paymentQuery, [online_payment_amount, online_payment_type, pumpsale_shift_id]);
//         }
//       }

//       await client.query("COMMIT");

//       return res.status(200).json({
//         statuscode: 200,
//         message: "Pump sales and shift data updated successfully",
//       });
//     } catch (error) {
//       await client.query("ROLLBACK");
   
//       return res.status(500).json({ error: "Failed to update pump sales and shift data" });
//     } finally {
//       client.release();
//     }
//   } catch (err) {
    
//     return res.status(500).json({ error: "Failed to process the request" });
//   }
// };



exports.getTodaysPumpSales = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (e.employee_id) ps.pump_sale_id, ps.bay_side, ps.fuel_type, ps.amount, ps.created_at, 
             a."pumpNumber", a.operatorshift, e."employeeName", a.attendence_id, e.employee_id
      FROM pump_sales ps
      JOIN attendence a ON ps.attendence_id = a.attendence_id
      JOIN employees e ON a.operator_name = e.employee_id
      WHERE ps.created_at::date = CURRENT_DATE
      ORDER BY e.employee_id, ps.created_at DESC
    `;

    const result = await pool.query(query);
    console.log('Filtered Pump Sales Result:', result.rows);

    if (result.rows.length > 0) {
      res.status(200).json({
        statuscode: 200,
        message: "Today's pump sales fetched successfully",
        employees: result.rows
      });
    } else {
      res.status(404).json({
        statuscode: 404,
        message: "No pump sales found for today",
        employees: []
      });
    }
  } catch (err) {
    console.error("Error fetching today's pump sales:", err);
    res.status(500).json({ error: "Failed to fetch pump sales" });
  }
};


//old code 
exports.getPumpSalesanydate = async (req, res) => {
  try {
    const { created_at, operatorName } = req.body;   

    if (!created_at || !operatorName) {
      return res.status(400).json({
        statuscode: 400,
        message: "Date and operatorName parameters are required",
      });
    }

    const body = `
      SELECT ps.pump_sale_id, ps.bay_side, ps.fuel_type, ps.omr,ps.res_id, ps.cmr, ps.sale, ps.amount,
             a."pumpNumber", a.operatorshift, e."employeeName", ps.created_at, e.employee_id
      FROM pump_sales ps
      JOIN attendence a ON ps.attendence_id = a.attendence_id
      JOIN employees e ON a.operator_name = e.employee_id
      WHERE ps.created_at::date = $1 AND e."employeeName" = $2
      ORDER BY e.employee_id, ps.created_at DESC
    `;

    const result = await pool.query(body, [created_at, operatorName]);

    if (result.rows.length > 0) {
      const salesData = [];

      // Loop through the result to organize data
      result.rows.forEach((sale) => {
        let existingOperator = salesData.find(
          (data) => data.operatorName === sale.employeeName && data.pumpNumber === sale.pumpNumber
        );

        if (!existingOperator) {
          existingOperator = {
            date: created_at,
            operatorName: sale.employeeName,
            pumpNumber: sale.pumpNumber,
            operatorShift: sale.operatorshift,
            salesDetails: []
          };

          salesData.push(existingOperator);
        }

        existingOperator.salesDetails.push({
          baySide: sale.bay_side,
          fuelType: sale.fuel_type,
          omr: sale.omr,
          cmr: sale.cmr,
          sale: sale.sale,
          amount: sale.amount,
          res_id:sale.res_id
        });
      });

      return res.status(200).json({
        statuscode: 200,
        message: `Pump sales fetched successfully for ${created_at} and operator ${operatorName}`,
        sales: salesData
      });
    } else {
      return res.status(404).json({
        statuscode: 404,
        message: `No pump sales found for ${created_at} and operator ${operatorName}`,
        sales: []
      });
    }
  } catch (err) {

    res.status(500).json({ error: "Failed to fetch pump sales" });
  }
};



// exports.getPumpSalesanydate = async (req, res) => {
//   try {
//     const { created_at, operatorName } = req.body;

//     if (!created_at || !operatorName) {
//       return res.status(400).json({
//         statuscode: 400,
//         message: "Date and operatorName parameters are required",
//       });
//     }

//     // Query to fetch pump sales and shift data (without credit & online payment)
//     const salesQuery = `
//       SELECT 
//         ps.pump_sale_id, ps.bay_side, ps.fuel_type, ps.omr, ps.cmr, ps.sale, ps.res_id, ps.amount,
//         a."pumpNumber", a.operatorshift, e."employeeName", ps.created_at, e.employee_id,
//         p.pump_sale_amount, p.shift_sales_amount, p.total_online_payment_amount, p.credit_amount,
//         p.pumpsale_shift_id -- This will be used to fetch related credit and online payments
//       FROM pump_sales ps
//       JOIN attendence a ON ps.attendence_id = a.attendence_id
//       JOIN employees e ON a.operator_name = e.employee_id
//       JOIN pumpsales_shift_data p ON ps.attendence_id = a.attendence_id
//       WHERE ps.created_at::date = $1 
//       AND e."employeeName" = $2
//       ORDER BY e.employee_id, ps.created_at DESC
//     `;

//     const salesResult = await pool.query(salesQuery, [created_at, operatorName]);
    
//     if (salesResult.rows.length === 0) {
//       return res.status(404).json({
//         statuscode: 404,
//         message: `No pump sales found for ${created_at} and operator ${operatorName}`,
//         sales: []
//       });
//     }

//     let salesData = [];

     
//     for (const sale of salesResult.rows) {
//       const { pumpsale_shift_id } = sale;

     
//       const creditQuery = `
//         SELECT bill_no, customer_name, product, quantity, rsp, bill_recipt, cost 
//         FROM credit_data 
//         WHERE pumpsale_shift_id = $1
//       `;
//       const creditResult = await pool.query(creditQuery, [pumpsale_shift_id]);

       
//       const onlinePaymentQuery = `
//         SELECT online_payment_amount, online_payment_type 
//         FROM online_payment_data 
//         WHERE pumpsale_shift_id = $1
//       `;
//       const onlinePaymentResult = await pool.query(onlinePaymentQuery, [pumpsale_shift_id]);

//       let existingOperator = salesData.find(
//         (data) => data.operatorName === sale.employeeName && data.pumpNumber === sale.pumpNumber
//       );

//       if (!existingOperator) {
//         existingOperator = {
//           date: created_at,
//           operatorName: sale.employeeName,
//           pumpNumber: sale.pumpNumber,
//           operatorShift: sale.operatorshift,
//           pump_sale_amount: sale.pump_sale_amount,
//           shift_sales_amount: sale.shift_sales_amount,
//           total_online_payment_amount: sale.total_online_payment_amount,
//           credit_amount: sale.credit_amount,
//           salesDetails: [],
//           onlinepayment: [],
//           creditdata: [],
//         };

//         salesData.push(existingOperator);
//       }

//       // Add sale details
//       existingOperator.salesDetails.push({
//         baySide: sale.bay_side,
//         fuelType: sale.fuel_type,
//         omr: sale.omr,
//         cmr: sale.cmr,
//         sale: sale.sale,
//         amount: sale.amount,
//         res_id: sale.res_id
//       });

//       // Add credit data (if exists)
//       existingOperator.creditdata = creditResult.rows;

//       // Add online payment data (if exists)
//       existingOperator.onlinepayment = onlinePaymentResult.rows;
//     }

//     return res.status(200).json({
//       statuscode: 200,
//       message: `Pump sales fetched successfully for ${created_at} and operator ${operatorName}`,
//       sales: salesData
//     });

//   } catch (err) {
//     console.error("Error fetching pump sales by date and operator:", err);
//     res.status(500).json({ error: "Failed to fetch pump sales" });
//   }
// };

exports.getpumsaleSearchbydate = async (req, res) => {
  try {
    const { created_at } = req.body;
    
 
    if (!created_at) {
      return res.status(400).json({
        statuscode: 400,
        message: "Date (created_at) is required",
      });
    }

    const query = `
      SELECT DISTINCT ON (e.employee_id) 
        ps.pump_sale_id, ps.bay_side, ps.fuel_type, ps.amount, ps.created_at,
        a."pumpNumber", a.operatorshift, e."employeeName", a.attendence_id, e.employee_id
      FROM pump_sales ps
      JOIN attendence a ON ps.attendence_id = a.attendence_id
      JOIN employees e ON a.operator_name = e.employee_id
      WHERE ps.created_at::date = $1
      ORDER BY e.employee_id, ps.created_at DESC
    `;

    const result = await pool.query(query, [created_at]);

    

    if (result.rows.length > 0) {
      res.status(200).json({
        statuscode: 200,
        message: `Pump sales for ${created_at} fetched successfully`,
        employees: result.rows
      });
    } else {
      res.status(404).json({
        statuscode: 404,
        message: `No pump sales found for ${created_at}`,
        employees: []
      });
    }
  } catch (err) {
    console.error("Error fetching pump sales:", err);
    res.status(500).json({ error: "Failed to fetch pump sales" });
  }
};