const pool = require('../db/db');

const format = require("pg-format");

exports.addattendence = async (req, res) => {
  try {
    const {
      date,
      operator_name,
      operatorshift,
      pumpNumber,
      bay_side,
      attendence,
      remarks,
    } = req.body;

    const attend = await pool.query(
      `INSERT INTO attendence(
          "date", "operator_name", "operatorshift", "pumpNumber",
          "attendence", "remarks"
      ) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
      [date, operator_name, operatorshift, pumpNumber, attendence, remarks]
    );

    

    const attendenceId = attend.rows[0]?.attendence_id;
    if (!attendenceId) {
      throw new Error("Failed to insert attendance.");
    }

    const defaultPumpSales = [];
    for (const bay of bay_side || []) {
      const { bay_name, guns } = bay;
      for (const gunInfo of guns || []) {
        const { gun, fuel_type } = gunInfo;
        defaultPumpSales.push([
          attendenceId,
          bay_name,
          gun,
          fuel_type,
          null,
          null,
          null,
          null,
          new Date(),
        ]);
      }
    }


    if (defaultPumpSales.length === 0) {
      return res.status(400).json({ error: "No pump sales data to insert." });
    }

    const pumpSalesQuery = `
    INSERT INTO pump_sales(
      attendence_id, bay_side, 
      guns, fuel_type, cmr, omr, res_id, amount, created_at
    ) VALUES %L RETURNING *`;
    const formattedQuery = format(pumpSalesQuery, defaultPumpSales);

    //  console.log(formattedQuery, "formattedquery");

    const pumpSalesResult = await pool.query(formattedQuery);
    // console.log(pumpSalesResult.rows, "Pump Sales Inserted");

    res.json({
      statusCode: 200,
      attendance: attend.rows[0],
      pumpSales: pumpSalesResult.rows,
    });
  } catch (err) {
    // console.error(err); // Log the error details for debugging
    res.status(500).json({ error: err.message || "Failed to insert attendance and pump sales" });
  }
};



exports.getAttendenceDetails = async (req, res) => {
  try {
    const query = `
      SELECT 
          a.attendence_id,
          a.date,
          a."pumpNumber", -- Use quotes for case sensitivity
          a.remarks,
          e."employeeName" AS operator_name,
          a.operatorshift,
          ARRAY_AGG(
            JSON_BUILD_OBJECT(
              'bay_side', p.bay_side
            )
          ) AS pump_sales
        FROM 
          attendence a
        INNER JOIN 
          employees e 
          ON a.operator_name = e.employee_id
        INNER JOIN 
          pump_sales p
        ON a.attendence_id = p.attendence_id
        GROUP BY 
          a.attendence_id, a.date, a."pumpNumber", a.remarks, e."employeeName",a.operatorshift;

    `;

    const attendenceDetails = await pool.query(query);
    res.json({
      statusCode: 200,
      attendence: attendenceDetails.rows
    });
  } catch (err) {

    res.status(500).json({ error: 'Failed to fetch attendance details' });
  }
};






exports.getAttendenceById = async (req, res) => {
  try {
    const { attendence_id } = req.query; // Extract attendance ID from query params

    const query = `
        SELECT 
            a.*, 
            e."employeeName" AS operator_name 
        FROM 
            attendence a
        JOIN 
            employees e 
        ON 
            a.operator_name = e.employee_id
        WHERE 
            a.attendence_id = $1
      `;

    const attendById = await pool.query(query, [attendence_id]);
    console.log('attendById',attendById);

    
    if (attendById.rows.length === 0) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    
    res.json({
      statusCode: 200,
      attendenceId: attendById.rows[0]
    });
  } catch (err) {
    console.error("Error fetching attendance by ID:", err);
    res.status(500).json({ error: "Failed to fetch attendance record" });
  }
};

exports.updateAttendence = async (req, res) => {
  try {
    const { date, operator_name, operatorshift, pumpNumber, bay_side, attendece, remarks } = req.body
    const values = [];
    const fields = [];

    let index = 1;
    if (date) {
      fields.push(`"date"= $${index++}`);
      values.push(date);
    }
    if (operator_name) {
      fields.push(`"operator_name"=$${index++}`);
      values.push(operator_name);
    }
    if (operatorshift) {
      fields.push(`"operatorshift"=$${index++}`);
      values.push(operatorshift);
    }
    if (pumpNumber) {
      fields.push(`"pumpNumber"$${index++}`);
      values.push(pumpNumber)
    }
    if (bay_side) {
      fields.push(`"bay_side"=$${index++}`);
      values.push(bay_side)
    }

    if (attendece) {
      fields.push(`"attendence"=$${index++}`);
      values.push(attendece)
    }
    if (remarks) {
      fields.push(`"remarks"=$${index++}`);
      values.push(remarks)
    }

    values.push(attendence_id);
    if (fields.length === 0) {
      res.status(400).json({
        statusCode: 400,
        message: 'No Fileds provided to update'
      })
    }

    const query = `
       UPDATE retailsellingprice
       SET ${fileds.json(', ')}
       WHERE "attendence_id"= $${index}
       RETURNING *;`;

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Attendence not Found",

      })
    }
    res.status(200).json({
      statusCode: 200,
      message: 'Updated Sucessfully',
      attendence: result.rows[0],
    })
  } catch (err) {
    res.status(500).json({ error: 'failed to update attendence' })
  }
}

