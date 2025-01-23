const pool = require('../db/db');

 
 
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

    const query = `
      SELECT 
        ps.*,
        COALESCE(a."pumpNumber", 'Not Assigned') AS pumpNumber,
        COALESCE(a.operatorshift, 'Unknown') AS operatorshift,
        e."employeeName" AS operator_name
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

    console.log('Query Result:', result.rows);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching pump details:', err.stack);
    res.status(500).json({ error: 'Failed to fetch pump details' });
  }
};




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
//         ps.*
//       FROM 
//         pump_sales ps
//       INNER JOIN 
//         attendence a ON ps.attendence_id = a.attendence_id
//       INNER JOIN 
//         employees e ON e.employee_id = a.operator_name
//       WHERE
//         a.date::date = $1 AND a.operator_name = $2
//       ORDER BY
//         ps.created_at ASC; -- Ensures data is sorted by shift or time
//     `;

//     const queryResult = await pool.query(query, [date, operatorName]);
//     const pumpSalesData = queryResult.rows;
//     console.log(pumpSalesData,'pumpSalesData');
   
//     const processedData = pumpSalesData.map((sale, index, salesArray) => {
//       if (index === 0) {
        
//         sale.omr = sale.omr;  
//       } else {
        
//         sale.omr = salesArray[index - 1].cmr;
//       }

//       return sale;
//     });

//     res.status(200).json(processedData);
//   } catch (err) {
//     console.error('Error fetching pump details:', err.stack);
//     res.status(500).json({ error: 'Failed to fetch pump details' });
//   }
// };

   
  exports.addPumpSales = async (req, res) => {
    try {
      const pumpSales = req.body;  
  
      if (!Array.isArray(pumpSales) || pumpSales.length === 0) {
        return res.status(400).json({ error: 'Request body should be an array of pump sales.' });
      }

  
      const values = pumpSales.map(pumpSale => [
        pumpSale.attendence_id, 
        pumpSale.bay_side, 
        pumpSale.guns, 
        pumpSale.fuel_type, 
        pumpSale.cmr, 
        pumpSale.omr, 
        pumpSale.res_id, 
        pumpSale.amount
      ]);
    
      const query = `
        INSERT INTO pump_sales (
          attendence_id, bay_side, guns, fuel_type, cmr, omr, res_id, amount, created_at
        )
        VALUES 
        ${values.map((_, index) => `($${index * 8 + 1}, $${index * 8 + 2}, $${index * 8 + 3}, $${index * 8 + 4}, $${index * 8 + 5}, $${index * 8 + 6}, $${index * 8 + 7}, $${index * 8 + 8}, NOW())`).join(', ')}
        RETURNING pump_sale_id
      `;
      const flatValues = values.flat();
      console.log(flatValues,'flatvalues');

      const result = await pool.query(query, flatValues);

      res.status(201).json({
        message: 'Pump sales added successfully',
        pump_sale_ids: result.rows.map(row => row.pump_sale_id)
      });

    } catch (err) {
      console.error('Error adding pump sales:', err.message);
      res.status(500).json({ error: 'Failed to add pump sales' });
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