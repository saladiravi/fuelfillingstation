const pool = require('../db/db');

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
          "bay_side", "attendence","remarks"
        ) VALUES($1, $2, $3, $4, $5, $6,$7) RETURNING *`,
        [date,operator_name, operatorshift, pumpNumber, bay_side, attendence,remarks]
      );
      console.log(attend);
      res.json(attend.rows[0]);
    } catch (err) {
      console.error('Error inserting attendence:', err.message);
      res.status(500).json({ error: 'Failed to insert attendence' });
    }
  };

  
  exports.getAttendenceDetails = async (req, res) => {
    try {
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
      `;
      
      const attendenceDetails = await pool.query(query);
      
      res.json(attendenceDetails.rows);
    } catch (err) {
      console.error(err);
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
  
      // Check if attendance record is found
      if (attendById.rows.length === 0) {
        return res.status(404).json({ error: "Attendance record not found" });
      }
  
      // Return the attendance record
      res.json(attendById.rows[0]);
    } catch (err) {
      console.error("Error fetching attendance by ID:", err);
      res.status(500).json({ error: "Failed to fetch attendance record" });
    }
  };
  
  