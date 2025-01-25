const pool = require('../db/db');

 
 
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

//     const query = `
//       SELECT 
//         ps.*,
//         COALESCE(a."pumpNumber", 'Not Assigned') AS pumpNumber,
//         COALESCE(a.operatorshift, 'Unknown') AS operatorshift,
//         e."employeeName" AS operator_name
//       FROM 
//         attendence a
//       INNER JOIN 
//         pump_sales ps ON ps.attendence_id = a.attendence_id
//       INNER JOIN 
//         employees e ON e.employee_id = a.operator_name
//       WHERE
//         a.date::date = $1 AND a.operator_name = $2;
//     `;

//     console.log('Query Parameters:', { date, operatorName });

//     const result = await pool.query(query, [date, operatorName]);

//     console.log('Query Result:', result.rows);

//     res.status(200).json(result.rows);
//   } catch (err) {
//     console.error('Error fetching pump details:', err.stack);
//     res.status(500).json({ error: 'Failed to fetch pump details' });
//   }
// };




// latest pumpsalesget By date 
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

const checkResult = await pool.query(checkQuery, [date, operatorName ]);

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

    console.log('Query Parameters:', { date, operatorName });

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
        if (!['ms', 'hsd', 'speed'].includes(columnName)) {
          row.retail_price = null; // Invalid fuel type, skip retail price
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

    console.log('Processed Result:', processedRows);

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
        message: 'should not be Empty',
      });
    }

    for (const pumpSale of pumpSalesUpdates) {
      const { attendence_id, cmr, omr, res_id, amount ,sale} = pumpSale;

      if (!attendence_id) {
        return res.status(400).json({
          statusCode: 400,
          message: 'attendence_id is required for each pump sale update.',
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
      fields.push(`"status" = $${index++}`);
      values.push(1);

      if (fields.length === 0) {
        return res.status(400).json({
          statusCode: 400,
          message: 'No fields provided to update in one of the pump sales objects.',
        });
      }

      // Add attendence_id for the WHERE clause
      values.push(attendence_id);

      const query = `
        UPDATE pump_sales
        SET ${fields.join(', ')}
        WHERE "attendence_id" = $${index}
        RETURNING *;
      `;

      const result = await pool.query(query, values);

      if (result.rowCount === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: `No pump sales found with attendence_id ${attendence_id}`,
        });
      }
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Pump sales updated successfully',
    });
  } catch (err) {
    console.error('Error updating pump sales:', err.message);
    res.status(500).json({ error: 'Failed to update pump sales' });
  }
};


  exports.getPumsales=async(req,res)=>
    {
        try{
            const result=await pool.query("SELECT * FROM employees"
            )
            if(result){
                res.status.json({
                    statuscode:200,
                    message:'Pump Sales fetched Sucessfully',
                    pumpsales:result.rows
                })
            }
        }catch(err){
            res.status(500).json({error:'Failed to add pump sales'});
        }
    }


    exports.getpumpSalesbyId=async (req,res)=>
    {
        try{
            const {pump_sale_id}=req.body
            
        }catch(err){
            res.status(500).json({error:'failed to add pump sales'});

        }
    }