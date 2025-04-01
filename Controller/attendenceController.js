const pool = require('../db/db');
const moment = require('moment');
const format = require("pg-format");

 
 
// exports.addattendence = async (req, res) => {
//   try {
//     const {
//       date,
//       operator_name,
//       from_time,
//       to_time,
//       operatorshift,
//       pumpNumber,
//       bay_side,  
//       attendence,
//       remarks,
//     } = req.body;

  
//     if (operatorshift.toLowerCase() === "air" || operatorshift.toLowerCase() === "general" || operatorshift.toLowerCase() === "abscent") {
//       if (bay_side && bay_side.length > 0) {
//         return res.status(400).json({
//           statusCode: 400,
//           error: `Employees in shift ${operatorshift} cannot have pump sales records.`
//         });
//       }
//     }

//     // ✅ Loop through bay_side only if it is provided and not empty
//     if (bay_side && Array.isArray(bay_side) && bay_side.length > 0) {
//       for (const bay of bay_side) {
//         const { bay_name } = bay;

//         const bayCheck = await pool.query(
//           `SELECT COUNT(*) FROM pump_sales ps
//            JOIN attendence atd ON ps.attendence_id = atd.attendence_id
//            WHERE atd."date" = $1 
//            AND atd."operatorshift" = $2 
//            AND atd."pumpNumber" = $3 
//            AND atd."operator_name" = $4`,  
//           [date, operatorshift, pumpNumber, operator_name]
//         );
//  }
//     }

//     // ✅ Insert attendance record
//     const attend = await pool.query(
//       `INSERT INTO attendence(
//           "date", "from_time","to_time","operator_name", "operatorshift", "pumpNumber",
//           "attendence", "remarks"
//       ) VALUES($1, $2, $3, $4, $5, $6,$7,$8) RETURNING *`,
//       [date, from_time, to_time, operator_name, operatorshift, pumpNumber, attendence, remarks]
//     );

//     const attendenceId = attend.rows[0]?.attendence_id;

//     // ✅ If shift is A or B, insert pump sales data
//     if (["MID-A", "A", "MID-B", "B"].includes(operatorshift.toUpperCase()) && bay_side && Array.isArray(bay_side) && bay_side.length > 0) {
//       const defaultPumpSales = [];

//       for (const bay of bay_side) {
//         const { bay_name, guns } = bay;
//         for (const gunInfo of guns || []) {
//           const { fuel_type } = gunInfo;
//           defaultPumpSales.push([
//             attendenceId,
//             bay_name,
//             fuel_type,
//             null,
//             null,
//             null,
//             null,
//             date,
//           ]);
//         }
//       }

//       if (defaultPumpSales.length > 0) {
//         const format = require("pg-format");
//         const pumpSalesQuery = format(
//           `INSERT INTO pump_sales(
//             attendence_id, bay_side, fuel_type, cmr, omr, res_id, amount, created_at
//           ) VALUES %L RETURNING *`,
//           defaultPumpSales
//         );

//         const pumpSalesResult = await pool.query(pumpSalesQuery);

//         return res.status(200).json({
//           statusCode: 200,
//           message: "Attendance and pump sales recorded successfully.",
//           attendance: attend.rows[0],
//           pumpSales: pumpSalesResult.rows,
//         });
//       }
//     }

//     return res.status(200).json({
//       statusCode: 200,
//       message: "Attendance recorded successfully.",
//       attendance: attend.rows[0],
//     });

//   } catch (err) {
//     console.error("Database Error:", err);
//     res.status(500).json({
//       statusCode: 500,
//       error: err.message || "Failed to insert attendance",
//     });
//   }
// };


exports.addattendence = async (req, res) => {
  try {
    const {
      date,
      operator_name,
      from_time,
      to_time,
      operatorshift,
      pumpNumber,
      bay_side,  
      attendence,
      remarks,
    } = req.body;

  
    if (operatorshift.toLowerCase() === "air" || operatorshift.toLowerCase() === "general" || operatorshift.toLowerCase() === "abscent") {
      if (bay_side && bay_side.length > 0) {
        return res.status(400).json({
          statusCode: 400,
          error: `Employees in shift ${operatorshift} cannot have pump sales records.`
        });
      }
    }

    // ✅ Loop through bay_side only if it is provided and not empty
    if (bay_side && Array.isArray(bay_side) && bay_side.length > 0) {
      for (const bay of bay_side) {
        const { bay_name } = bay;

        const bayCheck = await pool.query(
          `SELECT COUNT(*) FROM pump_sales ps
           JOIN attendence atd ON ps.attendence_id = atd.attendence_id
           WHERE atd."date" = $1 
           AND atd."operatorshift" = $2 
           AND atd."pumpNumber" = $3 `,  
          [date, operatorshift, pumpNumber ]
        );

        if (bayCheck.rows[0].count > 0) {
                return res.status(400).json({
                  statusCode: 400,
                  error: `Pump ${pumpNumber} is already assigned to another operator in shift ${operatorshift} on ${date}.`,
                });
              }
 }
    }

    // ✅ Insert attendance record
    const attend = await pool.query(
      `INSERT INTO attendence(
          "date", "from_time","to_time","operator_name", "operatorshift", "pumpNumber",
          "attendence", "remarks"
      ) VALUES($1, $2, $3, $4, $5, $6,$7,$8) RETURNING *`,
      [date, from_time, to_time, operator_name, operatorshift, pumpNumber, attendence, remarks]
    );

    const attendenceId = attend.rows[0]?.attendence_id;

    // ✅ If shift is A or B, insert pump sales data
    if (["MID-A", "A", "MID-B", "B"].includes(operatorshift.toUpperCase()) && bay_side && Array.isArray(bay_side) && bay_side.length > 0) {
      const defaultPumpSales = [];

      for (const bay of bay_side) {
        const { bay_name, guns } = bay;
        for (const gunInfo of guns || []) {
          const { fuel_type } = gunInfo;
          defaultPumpSales.push([
            attendenceId,
            bay_name,
            fuel_type,
            null,
            null,
            null,
            null,
            date,
          ]);
        }
      }

      if (defaultPumpSales.length > 0) {
        const format = require("pg-format");
        const pumpSalesQuery = format(
          `INSERT INTO pump_sales(
            attendence_id, bay_side, fuel_type, cmr, omr, res_id, amount, created_at
          ) VALUES %L RETURNING *`,
          defaultPumpSales
        );

        const pumpSalesResult = await pool.query(pumpSalesQuery);

        return res.status(200).json({
          statusCode: 200,
          message: "Attendance and pump sales recorded successfully.",
          attendance: attend.rows[0],
          pumpSales: pumpSalesResult.rows,
        });
      }
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Attendance recorded successfully.",
      attendance: attend.rows[0],
    });

  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({
      statusCode: 500,
      error: err.message || "Failed to insert attendance",
    });
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
   

    
    if (attendById.rows.length === 0) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    
    res.json({
      statusCode: 200,
      attendenceId: attendById.rows[0]
    });
  } catch (err) {
     
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


exports.getAttedencetoday = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.attendence_id,
        a.date,
        a."pumpNumber", 
        a.remarks,
        a.from_time,
        a.to_time,
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
      LEFT JOIN 
        pump_sales p
        ON a.attendence_id = p.attendence_id
      WHERE a.date = CURRENT_DATE
      GROUP BY 
        a.attendence_id, a.date, a."pumpNumber", a.remarks, e."employeeName", a.operatorshift,a.from_time,a.to_time;
    `;

    const attendenceDetails = await pool.query(query);

    if (attendenceDetails.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'No records found'
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Attendance details fetched successfully',
      data: attendenceDetails.rows
    });

  } catch (err) {
     
    res.status(500).json({ error: 'Failed to fetch attendance details' });
  }
};


exports.getdateAtendenceSearch = async (req, res) => {
  try {
    const { date } = req.body;


    if (!date) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Date is required'
      });
    }

    const query = `
      SELECT 
        a.attendence_id,
        a.date,
        a."pumpNumber", 
        a.remarks,
        a.from_time,
        a.to_time,
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
      LEFT JOIN 
        pump_sales p
        ON a.attendence_id = p.attendence_id
      WHERE a.date = $1
      GROUP BY 
        a.attendence_id, a.date, a."pumpNumber", a.remarks, e."employeeName", a.operatorshift,a.from_time,a.to_time;
    `;

    const attendByDate = await pool.query(query, [date]);

    if (attendByDate.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'No records found'
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Attendance details fetched successfully',
      data: attendByDate.rows
    });

  } catch (error) {
 
    res.status(500).json({ error: 'Failed to fetch attendance details' });
  }
};
