const pool = require('../db/db');
const moment = require('moment');


// exports.getPumpDetailsbydate = async (req, res) => {
//   try {
//     const { date, operator_name } = req.query;

//     const operatorName = parseInt(operator_name, 10);

//     if (isNaN(operatorName)) {
//       return res.status(400).json({ error: 'Invalid operator_name. It must be a number.' });
//     }

//     if (!date) {
//       return res.status(400).json({ error: 'Date is required.' });
//     }


//     // Check if data for the selected date and operator already exists
//     const checkQuery = `
//   SELECT ps.*
//   FROM attendence a
//   INNER JOIN pump_sales ps ON ps.attendence_id = a.attendence_id
//   WHERE a.date::date = $1 
//     AND a.operator_name = $2
   
//     AND ps.status = 1; -- Check if status is 1 in pump_sales
// `;

//     const checkResult = await pool.query(checkQuery, [date, operatorName]);

//     if (checkResult.rows.length > 0) {
//       return res.status(200).json({
//         message: 'Data already added for the selected date, operator, and shift.',
//         data: checkResult.rows
//       });
//     }

//     const query = `
//       SELECT 
//         ps.*,
//         COALESCE(a."pumpNumber", 'Not Assigned') AS pumpNumber,
//         COALESCE(a.operatorshift, 'Unknown') AS operatorshift,
//         e."employeeName" AS operator_name,
//         ps."cmr",
//         ps."bay_side",
//         ps."fuel_type"
//       FROM 
//         attendence a
//       INNER JOIN 
//         pump_sales ps ON ps.attendence_id = a.attendence_id
//       INNER JOIN 
//         employees e ON e.employee_id = a.operator_name
//       WHERE
//         a.date::date = $1 AND a.operator_name = $2;
//     `;


//     const result = await pool.query(query, [date, operatorName]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'No data found for the given date and operator.' });
//     }

//     // Process rows to fetch the correct OMR value
//     const processedRows = await Promise.all(
//       result.rows.map(async (row) => {
//         if (row.operatorshift === 'MID-A') {
//           // Fetch the CMR value from the previous day's B shift
//           const prevShiftQuery = `
//             SELECT ps."cmr"
//             FROM pump_sales ps
//             INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
//             WHERE 
//               a.date::date = $1::date  
//               AND a.operatorshift = 'B'
//               AND ps.bay_side = $2
//               AND ps.fuel_type = $3;
//           `;
//           const prevShiftResult = await pool.query(prevShiftQuery, [date, row.bay_side, row.fuel_type]);
//           row.omr = prevShiftResult.rows.length > 0 ? prevShiftResult.rows[0].cmr : null;
//         } if (row.operatorshift === 'A') {
//           // Fetch the CMR value from the previous day's B shift
//           const prevShiftQuery = `
//             SELECT ps."cmr"
//             FROM pump_sales ps
//             INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
//             WHERE 
//               a.date::date = $1::date 
//               AND a.operatorshift = 'MID-A'
//               AND ps.bay_side = $2
//               AND ps.fuel_type = $3;
//           `;
//           const prevShiftResult = await pool.query(prevShiftQuery, [date, row.bay_side, row.fuel_type]);
//           row.omr = prevShiftResult.rows.length > 0 ? prevShiftResult.rows[0].cmr : null;
//         }
         
//         else if (row.operatorshift === 'MID-B') {

//           const sameDayShiftQuery = `
//           SELECT ps."cmr"
//           FROM pump_sales ps
//           INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
//           WHERE 
//             a.date::date = $1
//             AND a.operatorshift = 'A'
//             AND ps.bay_side = $2
//             AND ps.fuel_type = $3;
//         `;
//           const sameDayShiftResult = await pool.query(sameDayShiftQuery, [date, row.bay_side, row.fuel_type]);
//           row.omr = sameDayShiftResult.rows.length > 0 ? sameDayShiftResult.rows[0].cmr : null;

//         } 
//          else if (row.operatorshift === 'B') {

//           const sameDayShiftQuery = `
//           SELECT ps."cmr"
//           FROM pump_sales ps
//           INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
//           WHERE 
//             a.date::date = $1
//             AND a.operatorshift = 'MID-B'
//             AND ps.bay_side = $2
//             AND ps.fuel_type = $3;
//         `;
//           const sameDayShiftResult = await pool.query(sameDayShiftQuery, [date, row.bay_side, row.fuel_type]);
//           row.omr = sameDayShiftResult.rows.length > 0 ? sameDayShiftResult.rows[0].cmr : null;

//         } else {
//           row.omr = null;
//         }

//         const columnName = row.fuel_type.toLowerCase(); // 'ms', 'hsd', or 'speed'
//         if (!['ms', 'hsd', 'speed', 'cng'].includes(columnName)) {
//           row.retail_price = null;
//         } else {
//           const rspQuery = `
//             SELECT rsp.${columnName} AS price
//             FROM retailsellingprice rsp
//             WHERE rsp.created_at::date = $1::date;
//           `;
//           const rspResult = await pool.query(rspQuery, [date]);
//           row.retail_price = rspResult.rows.length > 0 ? rspResult.rows[0].price : null;
//         }

//         return row;
//       })
//     );

//     res.status(200).json(processedRows);
//   } catch (err) {
     
//     res.status(500).json({ error: 'Failed to fetch pump details' });
//   }
// };

 


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

    // Check if data already exists for the given date and operator
    const checkQuery = `
      SELECT ps.* FROM attendence a
      INNER JOIN pump_sales ps ON ps.attendence_id = a.attendence_id
      WHERE a.date::date = $1 AND a.operator_name = $2 AND ps.status = 1;
    `;

    const checkResult = await pool.query(checkQuery, [date, operatorName]);
    if (checkResult.rows.length > 0) {
      return res.status(200).json({
        message: 'Data already added for the selected date, operator, and shift.',
        data: checkResult.rows
      });
    }

    // Fetch pump details
    const query = `
      SELECT 
        ps.*, COALESCE(a.pumpNumber, 'Not Assigned') AS pumpNumber,
        COALESCE(a.operatorshift, 'Unknown') AS operatorshift,
        e.employeeName AS operator_name, ps.cmr, ps.bay_side, ps.fuel_type
      FROM attendence a
      INNER JOIN pump_sales ps ON ps.attendence_id = a.attendence_id
      INNER JOIN employees e ON e.employee_id = a.operator_name
      WHERE a.date::date = $1 AND a.operator_name = $2;
    `;

    const result = await pool.query(query, [date, operatorName]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found for the given date and operator.' });
    }

    // Process rows to fetch correct OMR values
    const processedRows = await Promise.all(
      result.rows.map(async (row) => {
        if (row.operatorshift === 'MID-A') {
          // Fetch CMR from previous day's B shift
          const prevShiftQuery = `
            SELECT ps.cmr FROM pump_sales ps
            INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
            WHERE a.date::date = $1::date AND a.operatorshift = 'B' AND ps.bay_side = $2 AND ps.fuel_type = $3;
          `;
          const prevShiftResult = await pool.query(prevShiftQuery, [date, row.bay_side, row.fuel_type]);
          row.omr = prevShiftResult.rows.length > 0 ? prevShiftResult.rows[0].cmr : null;
        } 
        else if (row.operatorshift === 'A') {
          // Fetch from MID-A, or fallback to previous day's B shift
          let prevShiftQuery = `
            SELECT ps.cmr FROM pump_sales ps
            INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
            WHERE a.date::date = $1::date AND a.operatorshift = 'MID-A' AND ps.bay_side = $2 AND ps.fuel_type = $3;
          `;
          let prevShiftResult = await pool.query(prevShiftQuery, [date, row.bay_side, row.fuel_type]);
          if (prevShiftResult.rows.length === 0) {
            prevShiftQuery = `
              SELECT ps.cmr FROM pump_sales ps
              INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
              WHERE a.date::date = $1::date AND a.operatorshift = 'B' AND ps.bay_side = $2 AND ps.fuel_type = $3;
            `;
            prevShiftResult = await pool.query(prevShiftQuery, [date, row.bay_side, row.fuel_type]);
          }
          row.omr = prevShiftResult.rows.length > 0 ? prevShiftResult.rows[0].cmr : null;
        } 
        else if (row.operatorshift === 'MID-B') {
          // Fetch from A shift
          const sameDayShiftQuery = `
            SELECT ps.cmr FROM pump_sales ps
            INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
            WHERE a.date::date = $1 AND a.operatorshift = 'A' AND ps.bay_side = $2 AND ps.fuel_type = $3;
          `;
          const sameDayShiftResult = await pool.query(sameDayShiftQuery, [date, row.bay_side, row.fuel_type]);
          row.omr = sameDayShiftResult.rows.length > 0 ? sameDayShiftResult.rows[0].cmr : null;
        } 
        else if (row.operatorshift === 'B') {
          // Fetch from MID-B, or fallback to A shift if MID-B is missing
          let sameDayShiftQuery = `
            SELECT ps.cmr FROM pump_sales ps
            INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
            WHERE a.date::date = $1 AND a.operatorshift = 'MID-B' AND ps.bay_side = $2 AND ps.fuel_type = $3;
          `;
          let sameDayShiftResult = await pool.query(sameDayShiftQuery, [date, row.bay_side, row.fuel_type]);
          if (sameDayShiftResult.rows.length === 0) {
            sameDayShiftQuery = `
              SELECT ps.cmr FROM pump_sales ps
              INNER JOIN attendence a ON ps.attendence_id = a.attendence_id
              WHERE a.date::date = $1 AND a.operatorshift = 'A' AND ps.bay_side = $2 AND ps.fuel_type = $3;
            `;
            sameDayShiftResult = await pool.query(sameDayShiftQuery, [date, row.bay_side, row.fuel_type]);
          }
          row.omr = sameDayShiftResult.rows.length > 0 ? sameDayShiftResult.rows[0].cmr : null;
        } else {
          row.omr = null;
        }

        // Fetch retail price
        const columnName = row.fuel_type.toLowerCase();
        if (!['ms', 'hsd', 'speed', 'cng'].includes(columnName)) {
          row.retail_price = null;
        } else {
          const rspQuery = `
            SELECT rsp.${columnName} AS price FROM retailsellingprice rsp
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
    res.status(500).json({ error: 'Failed to fetch pump details' });
  }
};


exports.addPumpSales = async (req, res) => {
  try {
    const {
      pumpSales, // Array of pump sales
      attendence_id,
      pump_sale_amount,
      shift_sales_amount,
      dm_amount,
      advance_amount,
      credit_amount,
      total_online_payment_amount,
      cash_notes,
      cash_notes_advance,
      credit_data,
      
      cash_amount,
      upi,
      pos,
      alp,
      company_account,
      short_amount,
      plus_amount
    } = req.body;

    if (!attendence_id) {
      return res.status(400).json({ statusCode: 400, message: "Attendance ID is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

  
      const existingShiftQuery = `SELECT pumpsale_shift_id FROM pumpsales_shift_data WHERE attendence_id = $1`;
      const existingShift = await client.query(existingShiftQuery, [attendence_id]);

      if (existingShift.rows.length > 0) {
      
        await client.query("ROLLBACK");
        return res.status(400).json({ statusCode: 400, message: "Data already exists for this attendance ID." });
      }

      // Insert new shift sales data
      const shiftQuery = `
        INSERT INTO pumpsales_shift_data (
          attendence_id, pump_sale_amount, shift_sales_amount, dm_amount, advance_amount, credit_amount, total_online_payment_amount,
          pump_sale_500, pump_sale_200, pump_sale_100, pump_sale_50, 
          pump_sale_20, pump_sale_10, pump_sale_5, pump_sale_2, pump_sale_1,
           advance_500, advance_200, advance_100, advance_50, 
          advance_20, advance_10, advance_5, advance_2, advance_1,cash_amount,upi,pos,alp,company_account,short_amount,plus_amount
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25,$26,$27,$28,$29,$30,$31,$32
        ) RETURNING pumpsale_shift_id;
      `;

      const shiftValues = [
        attendence_id,
        pump_sale_amount || "0",
        shift_sales_amount || "0",
        dm_amount || "0",
        advance_amount || "0",
        credit_amount || "0",
        total_online_payment_amount || "0",
        cash_notes?.["pump_sale_500"] || "0",
        cash_notes?.["pump_sale_200"] || "0",
        cash_notes?.["pump_sale_100"] || "0",
        cash_notes?.["pump_sale_50"] || "0",
        cash_notes?.["pump_sale_20"] || "0",
        cash_notes?.["pump_sale_10"] || "0",
        cash_notes?.["pump_sale_5"] || "0",
        cash_notes?.["pump_sale_2"] || "0",
        cash_notes?.["pump_sale_1"] || "0",
        cash_notes_advance?.["advance_500"] || "0",
        cash_notes_advance?.["advance_200"] || "0",
        cash_notes_advance?.["advance_100"] || "0",
        cash_notes_advance?.["advance_50"] || "0",
        cash_notes_advance?.["advance_20"] || "0",
        cash_notes_advance?.["advance_10"] || "0",
        cash_notes_advance?.["advance_5"] || "0",
        cash_notes_advance?.["advance_2"] || "0",
        cash_notes_advance?.["advance_1"] || "0",
        cash_amount || "0",
        upi || "0",
        pos || "0",
        alp || "0",
        company_account ||  "0",
        short_amount || "0",
        plus_amount || "0"
      ];

      const shiftResult = await client.query(shiftQuery, shiftValues);
      const pumpsale_shift_id = shiftResult.rows[0].pumpsale_shift_id;

      // Batch update pump sales
      if (Array.isArray(pumpSales) && pumpSales.length > 0) {
        const updateQueries = pumpSales.map(({ pump_sale_id, cmr, omr, res_id, amount, sale, fuel_type, guns}) => ({
          query: `
            UPDATE pump_sales
            SET cmr = $1, omr = $2, amount = $3, sale = $4, fuel_type = $5, guns = $6, res_id = $7
            WHERE pump_sale_id = $8 
          `,
          values: [cmr || 0, omr || 0, amount || 0, sale || 0, fuel_type || '', guns || '', res_id || '',pump_sale_id]
        }));

        for (const { query, values } of updateQueries) {
          await client.query(query, values);
        }
      }

      // Process file uploads for credit_data
      const billReceipts = Array.isArray(req.files) ? req.files.map(file => `/uploads/${file.filename}`) : [];
      if (Array.isArray(credit_data)) {
        credit_data.forEach((credit, index) => {
          credit.bill_recipt = billReceipts[index] || null;
        });
      }

      // Batch insert credit data
      // if (Array.isArray(credit_data) && credit_data.length > 0) {
      //   const creditQuery = `
      //     INSERT INTO credit_data (bill_no, customer_name, product, quantity, rsp, cost, bill_recipt, pumpsale_shift_id)
      //     VALUES ${credit_data.map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`).join(", ")}
      //   `;
      //   const creditValues = credit_data.flatMap(({ bill_no, customer_name, product, quantity, rsp, cost, bill_recipt }) => [
      //     bill_no, customer_name, product, quantity, rsp, cost, bill_recipt, pumpsale_shift_id
      //   ]);

      //   await client.query(creditQuery, creditValues);
      // }

      if (Array.isArray(credit_data) && credit_data.length > 0) { 
        const creditQuery = `
          INSERT INTO credit_data 
            (bill_no, customer_name, product, quantity, rsp, cost, bill_recipt, pumpsale_shift_id, 
             bill_type, payment_status, vehicle_number, paid_datetime)
          VALUES ${credit_data.map((_, i) => `($${i * 12 + 1}, $${i * 12 + 2}, $${i * 12 + 3}, $${i * 12 + 4}, 
                                               $${i * 12 + 5}, $${i * 12 + 6}, $${i * 12 + 7}, $${i * 12 + 8},
                                               $${i * 12 + 9}, $${i * 12 + 10}, $${i * 12 + 11}, $${i * 12 + 12})`).join(", ")}
        `;
      
        const creditValues = credit_data.flatMap(({ 
          bill_no, customer_name, product, quantity, rsp, cost, bill_recipt, 
          bill_type, payment_status, vehicle_number, paid_datetime 
        }) => [
          bill_no || '', 
          customer_name || '', 
          product || '', 
          quantity || 0, 
          rsp || '', 
          cost || 0, 
          bill_recipt || null, 
          pumpsale_shift_id, 
          bill_type || '', 
          payment_status || '', 
          vehicle_number || '', 
          paid_datetime ? new Date(paid_datetime) : null // Ensure valid timestamp
        ]);
      
        console.log("Executing Query:", creditQuery);
        console.log("Query Values:", JSON.stringify(creditValues, null, 2));
      
        await client.query(creditQuery, creditValues);
      }
      

      await client.query("COMMIT");

      res.status(200).json({ statusCode: 200, message: "Pump sales and shift data updated successfully." });

    } catch (error) {
      await client.query("ROLLBACK");
      
      res.status(500).json({ error: "Failed to update pump sales and shift data." });
    } finally {
      client.release();
    }
  } catch (err) {
    
    res.status(500).json({ error: "Failed to process the request." });
  }
};




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

 


exports.getPumpSalesanydate = async (req, res) => {
  try {
    const { created_at, operatorName } = req.body;

    if (!created_at || !operatorName) {
      return res.status(400).json({
        statuscode: 400,
        message: "Date and operatorName parameters are required",
      });
    }

    // Query to fetch pump sales and shift data
    const salesQuery = `
      SELECT DISTINCT ON (ps.pump_sale_id)
        ps.pump_sale_id, ps.bay_side, ps.fuel_type, ps.omr, ps.cmr, ps.sale, ps.res_id, ps.amount,
        a."pumpNumber", a.operatorshift, e."employeeName", ps.created_at, e.employee_id,
        p.pump_sale_amount, p.shift_sales_amount, p.total_online_payment_amount, p.credit_amount,
        p.pumpsale_shift_id, p.pump_sale_500, p.pump_sale_200, p.pump_sale_100, p.pump_sale_50, 
        p.pump_sale_20, p.pump_sale_10, p.pump_sale_5, p.pump_sale_2, p.pump_sale_1, 
        p.advance_amount, p.advance_500, p.advance_200, p.advance_100, p.advance_50, 
        p.advance_20, p.advance_10, p.advance_5, p.advance_2, p.advance_1, 
        p.cash_amount, p.upi, p.pos, p.alp, p.company_account, p.short_amount,p.plus_amount
      FROM pump_sales ps
      JOIN attendence a ON ps.attendence_id = a.attendence_id
      JOIN employees e ON a.operator_name = e.employee_id
      INNER JOIN pumpsales_shift_data p ON ps.attendence_id = p.attendence_id
      WHERE ps.created_at::date = $1 
      AND e."employeeName" = $2
      ORDER BY ps.pump_sale_id, ps.created_at DESC;
    `;

    const salesResult = await pool.query(salesQuery, [created_at, operatorName]);
 
    if (salesResult.rows.length === 0) {
      return res.status(404).json({
        statuscode: 404,
        message: `No pump sales found for ${created_at} and operator ${operatorName}`,
        sales: []
      });
    }

    let salesData = [];

    for (const sale of salesResult.rows) {
      const { pumpsale_shift_id } = sale;
 
      // Fetch credit data for the shift
      const creditQuery = `
        SELECT bill_no, customer_name, product, quantity, rsp, bill_recipt, cost,bill_type,payment_status,vehicle_number,paid_datetime 
        FROM credit_data 
        WHERE pumpsale_shift_id = $1
      `;
      const creditResult = await pool.query(creditQuery, [pumpsale_shift_id]);
     
      // Check if operator data already exists in salesData
      let existingOperator = salesData.find(
        (data) => data.operatorName === sale.employeeName && data.pumpNumber === sale.pumpNumber
      );

      if (!existingOperator) {
        existingOperator = {
          date: created_at,
          operatorName: sale.employeeName,
          pumpNumber: sale.pumpNumber,
          operatorShift: sale.operatorshift,
          pump_sale_amount: sale.pump_sale_amount,
          shift_sales_amount: sale.shift_sales_amount,
          total_online_payment_amount: sale.total_online_payment_amount,
          credit_amount: sale.credit_amount,
          pump_sale_500: sale.pump_sale_500,
          pump_sale_200: sale.pump_sale_200,
          pump_sale_100: sale.pump_sale_100,
          pump_sale_50: sale.pump_sale_50,
          pump_sale_20: sale.pump_sale_20,
          pump_sale_10: sale.pump_sale_10,
          pump_sale_5: sale.pump_sale_5,
          pump_sale_2: sale.pump_sale_2,
          pump_sale_1: sale.pump_sale_1,
          advance_500: sale.advance_500,
          advance_200: sale.advance_200,
          advance_100: sale.advance_100,
          advance_50: sale.advance_50,
          advance_20: sale.advance_20,
          advance_10: sale.advance_10,
          advance_5: sale.advance_5,
          advance_2: sale.advance_2,
          advance_1: sale.advance_1,
          cash_amount: sale.cash_amount,
          advance_amount:sale.advance_amount,
          upi: sale.upi,
          pos: sale.pos,
          alp: sale.alp,
          plus_amount:sale.plus_amount,
          company_account: sale.company_account,
          salesDetails: [],
          creditdata: [],
        };

        salesData.push(existingOperator);
      }

      // Check if this sale record already exists in salesDetails
      const saleExists = existingOperator.salesDetails.some(
        (detail) => detail.pumpSaleId === sale.pump_sale_id
      );

      if (!saleExists) {
        existingOperator.salesDetails.push({
          pumpSaleId: sale.pump_sale_id,
          baySide: sale.bay_side,
          fuelType: sale.fuel_type,
          omr: sale.omr,
          cmr: sale.cmr,
          sale: sale.sale,
          amount: sale.amount,
          res_id: sale.res_id,
          attendence_id:sale.attendence_id
        });
      }

      // Add credit data
      existingOperator.creditdata = creditResult.rows;
    }

    return res.status(200).json({
      statuscode: 200,
      message: `Pump sales fetched successfully for ${created_at} and operator ${operatorName}`,
      sales: salesData
    });

  } catch (err) {
   
    res.status(500).json({ error: "Failed to fetch pump sales" });
  }
};


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
     
    res.status(500).json({ error: "Failed to fetch pump sales" });
  }
};


exports.pumpdetailsforedit = async (req, res) => {
  try {
    const { created_at, operatorName } = req.body;

    if (!created_at || !operatorName) {
      return res.status(400).json({
        statuscode: 400,
        message: "Date and operatorName parameters are required",
      });
    }

    // Query to fetch pump sales and shift data
    const salesQuery = `
      SELECT DISTINCT ON (ps.pump_sale_id)
        ps.pump_sale_id, ps.bay_side, ps.fuel_type, ps.omr, ps.cmr, ps.sale, ps.res_id, ps.amount,ps.attendence_id,
        a."pumpNumber", a.operatorshift, e."employeeName", ps.created_at, e.employee_id,
        p.pump_sale_amount, p.shift_sales_amount, p.total_online_payment_amount, p.credit_amount,
        p.pumpsale_shift_id, p.pump_sale_500, p.pump_sale_200, p.pump_sale_100, p.pump_sale_50, 
        p.pump_sale_20, p.pump_sale_10, p.pump_sale_5, p.pump_sale_2, p.pump_sale_1, 
        p.advance_amount, p.advance_500, p.advance_200, p.advance_100, p.advance_50, 
        p.advance_20, p.advance_10, p.advance_5, p.advance_2, p.advance_1, 
        p.cash_amount, p.upi, p.pos, p.alp, p.company_account, p.short_amount,p.plus_amount,p.attendence_id
      FROM pump_sales ps
      JOIN attendence a ON ps.attendence_id = a.attendence_id
      JOIN employees e ON a.operator_name = e.employee_id
      INNER JOIN pumpsales_shift_data p ON ps.attendence_id = p.attendence_id
      WHERE ps.created_at::date = $1 
      AND e."employeeName" = $2
      ORDER BY ps.pump_sale_id, ps.created_at DESC;
    `;

    const salesResult = await pool.query(salesQuery, [created_at, operatorName]);
   

    if (salesResult.rows.length === 0) {
      return res.status(404).json({
        statuscode: 404,
        message: `No pump sales found for ${created_at} and operator ${operatorName}`,
        sales: []
      });
    }

    let salesData = [];

    for (const sale of salesResult.rows) {
      const { pumpsale_shift_id } = sale;

     
      // Fetch credit data for the shift
      const creditQuery = `
        SELECT credit_data_id,bill_no, customer_name, product, quantity, rsp, bill_recipt, cost,bill_type,paid_datetime,
        payment_status ,vehicle_number
        FROM credit_data 
        WHERE pumpsale_shift_id = $1
      `;
      const creditResult = await pool.query(creditQuery, [pumpsale_shift_id]);
     
      // Check if operator data already exists in salesData
      let existingOperator = salesData.find(
        (data) => data.operatorName === sale.employeeName && data.pumpNumber === sale.pumpNumber
      );

      if (!existingOperator) {
        existingOperator = {
          date: created_at,
          operatorName: sale.employeeName,
          pumpNumber: sale.pumpNumber,
          operatorShift: sale.operatorshift,
          pump_sale_amount: sale.pump_sale_amount,
          shift_sales_amount: sale.shift_sales_amount,
          total_online_payment_amount: sale.total_online_payment_amount,
          credit_amount: sale.credit_amount,
          pump_sale_500: sale.pump_sale_500,
          pump_sale_200: sale.pump_sale_200,
          pump_sale_100: sale.pump_sale_100,
          pump_sale_50: sale.pump_sale_50,
          pump_sale_20: sale.pump_sale_20,
          pump_sale_10: sale.pump_sale_10,
          pump_sale_5: sale.pump_sale_5,
          pump_sale_2: sale.pump_sale_2,
          pump_sale_1: sale.pump_sale_1,
          advance_500: sale.advance_500,
          advance_200: sale.advance_200,
          advance_100: sale.advance_100,
          advance_50: sale.advance_50,
          advance_20: sale.advance_20,
          advance_10: sale.advance_10,
          advance_5: sale.advance_5,
          advance_2: sale.advance_2,
          advance_1: sale.advance_1,
          cash_amount: sale.cash_amount,
          attendence_id:sale.attendence_id,
          upi: sale.upi,
          pos: sale.pos,
          alp: sale.alp,
          short_amount:sale.short_amount,
          plus_amount:sale.plus_amount,
          company_account: sale.company_account,
          salesDetails: [],
          creditdata: [],
        };

        salesData.push(existingOperator);
      }

      // Check if this sale record already exists in salesDetails
      const saleExists = existingOperator.salesDetails.some(
        (detail) => detail.pumpSaleId === sale.pump_sale_id
      );

      if (!saleExists) {
        existingOperator.salesDetails.push({
          pumpSaleId: sale.pump_sale_id,
          baySide: sale.bay_side,
          fuelType: sale.fuel_type,
          omr: sale.omr,
          cmr: sale.cmr,
          sale: sale.sale,
          amount: sale.amount,
          res_id: sale.res_id,
          attendence_id:sale.attendence_id
        });
      }

      // Add credit data
      existingOperator.creditdata = creditResult.rows;
    }

    return res.status(200).json({
      statuscode: 200,
      message: `Pump sales fetched successfully for ${created_at} and operator ${operatorName}`,
      sales: salesData
    });

  } catch (err) {
 
    res.status(500).json({ error: "Failed to fetch pump sales" });
  }
};


 
exports.updatePumpDetails = async (req, res) => {
  try {
    
    const {
      pumpSales, // Array of pump sales
      attendence_id,
      pump_sale_amount,
      shift_sales_amount,
      dm_amount,
      advance_amount,
      credit_amount,
      total_online_payment_amount,
      cash_notes,
      cash_notes_advance,
      credit_data,
      cash_amount,
      upi,
      pos,
      alp,
      company_account,
      short_amount,
      plus_amount
    } = req.body;

    if (!attendence_id) {
      return res.status(400).json({ statusCode: 400, message: "Attendance ID is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if shift data already exists
      const existingShiftQuery = `SELECT pumpsale_shift_id FROM pumpsales_shift_data WHERE attendence_id = $1`;
      const existingShift = await client.query(existingShiftQuery, [attendence_id]);
    

      let pumpsale_shift_id;

      if (existingShift.rows.length > 0) {
        // Update existing shift data
        pumpsale_shift_id = existingShift.rows[0].pumpsale_shift_id;
     

        const updateShiftQuery = `
          UPDATE pumpsales_shift_data 
          SET pump_sale_amount = $1, shift_sales_amount = $2, dm_amount = $3, advance_amount = $4,
              credit_amount = $5, total_online_payment_amount = $6, 
              pump_sale_500 = $7, pump_sale_200 = $8, pump_sale_100 = $9, pump_sale_50 = $10, 
              pump_sale_20 = $11, pump_sale_10 = $12, pump_sale_5 = $13, pump_sale_2 = $14, pump_sale_1 = $15,
              advance_500 = $16, advance_200 = $17, advance_100 = $18, advance_50 = $19, 
              advance_20 = $20, advance_10 = $21, advance_5 = $22, advance_2 = $23, advance_1 = $24,
              cash_amount = $25, upi = $26, pos = $27, alp = $28, company_account = $29, 
              short_amount = $30, plus_amount = $31
          WHERE attendence_id = $32
        `;

        const updateShiftValues = [
          pump_sale_amount || "0",
          shift_sales_amount || "0",
          dm_amount || "0",
          advance_amount || "0",
          credit_amount || "0",
          total_online_payment_amount || "0",
          cash_notes?.["pump_sale_500"] || "0",
          cash_notes?.["pump_sale_200"] || "0",
          cash_notes?.["pump_sale_100"] || "0",
          cash_notes?.["pump_sale_50"] || "0",
          cash_notes?.["pump_sale_20"] || "0",
          cash_notes?.["pump_sale_10"] || "0",
          cash_notes?.["pump_sale_5"] || "0",
          cash_notes?.["pump_sale_2"] || "0",
          cash_notes?.["pump_sale_1"] || "0",
          cash_notes_advance?.["advance_500"] || "0",
          cash_notes_advance?.["advance_200"] || "0",
          cash_notes_advance?.["advance_100"] || "0",
          cash_notes_advance?.["advance_50"] || "0",
          cash_notes_advance?.["advance_20"] || "0",
          cash_notes_advance?.["advance_10"] || "0",
          cash_notes_advance?.["advance_5"] || "0",
          cash_notes_advance?.["advance_2"] || "0",
          cash_notes_advance?.["advance_1"] || "0",
          cash_amount || "0",
          upi || "0",
          pos || "0",
          alp || "0",
          company_account || "0",
          short_amount || "0",
          plus_amount || "0",
          attendence_id
        ];

        await client.query(updateShiftQuery, updateShiftValues);
      } else {
        // Insert new shift data
        const shiftQuery = `
          INSERT INTO pumpsales_shift_data (
            attendence_id, pump_sale_amount, shift_sales_amount, dm_amount, advance_amount, credit_amount, total_online_payment_amount,
            pump_sale_500, pump_sale_200, pump_sale_100, pump_sale_50, 
            pump_sale_20, pump_sale_10, pump_sale_5, pump_sale_2, pump_sale_1,
            advance_500, advance_200, advance_100, advance_50, 
            advance_20, advance_10, advance_5, advance_2, advance_1, cash_amount, upi, pos, alp, company_account, short_amount, plus_amount
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
          ) RETURNING pumpsale_shift_id;
        `;

        const shiftValues = [
          attendence_id,
          pump_sale_amount || "0",
          shift_sales_amount || "0",
          dm_amount || "0",
          advance_amount || "0",
          credit_amount || "0",
          total_online_payment_amount || "0",
          cash_notes?.["pump_sale_500"] || "0",
          cash_notes?.["pump_sale_200"] || "0",
          cash_notes?.["pump_sale_100"] || "0",
          cash_notes?.["pump_sale_50"] || "0",
          cash_notes?.["pump_sale_20"] || "0",
          cash_notes?.["pump_sale_10"] || "0",
          cash_notes?.["pump_sale_5"] || "0",
          cash_notes?.["pump_sale_2"] || "0",
          cash_notes?.["pump_sale_1"] || "0",
          cash_notes_advance?.["advance_500"] || "0",
          cash_notes_advance?.["advance_200"] || "0",
          cash_notes_advance?.["advance_100"] || "0",
          cash_notes_advance?.["advance_50"] || "0",
          cash_notes_advance?.["advance_20"] || "0",
          cash_notes_advance?.["advance_10"] || "0",
          cash_notes_advance?.["advance_5"] || "0",
          cash_notes_advance?.["advance_2"] || "0",
          cash_notes_advance?.["advance_1"] || "0",
          cash_amount || "0",
          upi || "0",
          pos || "0",
          alp || "0",
          company_account || "0",
          short_amount || "0",
          plus_amount || "0"
        ];

        const shiftResult = await client.query(shiftQuery, shiftValues);
        pumpsale_shift_id = shiftResult.rows[0].pumpsale_shift_id;
      }

      // Update pump sales
      if (Array.isArray(pumpSales) && pumpSales.length > 0) {
        const updateQueries = pumpSales.map(({ pump_sale_id, cmr, omr, res_id, amount, sale, fuel_type, guns }) => ({
          query: `
            UPDATE pump_sales 
            SET cmr = $1, omr = $2, amount = $3, sale = $4, fuel_type = $5, guns = $6, res_id = $7
            WHERE pump_sale_id = $8 
          `,
          values: [cmr || 0, omr || 0, amount || 0, sale || 0, fuel_type || '', guns || '', res_id || '', pump_sale_id]
        }));

        for (const { query, values } of updateQueries) {
          await client.query(query, values);
        }
      }
      const billReceipts = Array.isArray(req.files) ? req.files.map(file => `/uploads/${file.filename}`) : [];
      if (Array.isArray(credit_data)) {
        credit_data.forEach((credit, index) => {
          credit.bill_recipt = billReceipts[index] || null;
        });
      }

      if (Array.isArray(credit_data) && credit_data.length > 0) {
        // Ensure each credit_data entry gets the correct pumpsale_shift_id
        const updatedCreditData = credit_data.map(credit => ({
          ...credit,
          pumpsale_shift_id: credit.pumpsale_shift_id || pumpsale_shift_id
        })).filter(credit => credit.pumpsale_shift_id); // Remove entries without pumpsale_shift_id
      
        if (updatedCreditData.length > 0) {
          await Promise.all(
            updatedCreditData.map(async credit => {
              const query = `
                UPDATE credit_data
                SET bill_no = $1, customer_name = $2, product = $3, quantity = $4,
                    rsp = $5, cost = $6, bill_recipt = $7,bill_type=$8,payment_status=$9,vehicle_number=$10,paid_datetime=$11
                WHERE pumpsale_shift_id = $12 AND credit_data_id = $13;
              `;  
      
              const values = [
                credit.bill_no || '',
                credit.customer_name || '',
                credit.product || '',
                credit.quantity || 0,
                credit.rsp || '',
                credit.cost || 0,
                credit.bill_recipt || null,
                credit.bill_type || '', // Correct position for bill_type
                credit.payment_status || '', // Correct position for payment_status
                credit.vehicle_number || '', // Correct position for vehicle_number
                credit.paid_datetime ? new Date(credit.paid_datetime) : null, // Ensure valid timestamp
                credit.pumpsale_shift_id, // Now at correct position ($12)
                credit.credit_data_id // Now at correct position ($13)
              ];
              
       
              await client.query(query, values);
            })
          );
        }
      }
      
      await client.query("COMMIT");
      res.status(200).json({ statusCode: 200, message: "Pump sales and shift data updated successfully." });

    } catch (error) {
      await client.query("ROLLBACK");
     
      res.status(500).json({ error: "Failed to update pump sales and shift data." });
    } finally {
      client.release();
    } 
  } catch (err) {
   
    res.status(500).json({ error: "Failed to process the request." });
  }
};
