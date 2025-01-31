const pool=require('../db/db');
const moment=require('moment');

exports.getAttendanceByDateRange = async (req, res) => {
    try {
      const { fromDate, toDate, employeeName } = req.body; // Read from req.body
  
      // Validate input
      if (!fromDate || !toDate) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Both fromDate and toDate are required',
        });
      }
  
      let query = `
        SELECT 
          a.attendence_id,
          a.date,
          a."pumpNumber", 
          a.remarks,
          e."employeeName" AS operator_name,
          a.operatorshift,
          a.attendence,  -- Display attendance (1 or 0)
          COUNT(*) FILTER (WHERE a.attendence = 1) AS present_count,  -- Count present
          COUNT(*) FILTER (WHERE a.attendence = 0) AS absent_count,   -- Count absent
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
        WHERE a.date BETWEEN $1 AND $2
      `;
  
      const queryParams = [fromDate, toDate];
  
      // If employeeName is provided, add it to the query
      if (employeeName) {
        query += ` AND e."employeeName" ILIKE $3`; // Case-insensitive search
        queryParams.push(`%${employeeName}%`);
      }
  
      query += `
        GROUP BY 
          a.attendence_id, a.date, a."pumpNumber", a.remarks, e."employeeName", a.operatorshift, a.attendence
      `;
  
      const attendanceDetails = await pool.query(query, queryParams);
  
      if (attendanceDetails.rows.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: 'No records found',
        });
      }
  
      res.status(200).json({
        statusCode: 200,
        message: 'Attendance details fetched successfully',
        data: attendanceDetails.rows,
      });
  
    } catch (err) {
      console.error('Error fetching attendance details:', err.message);
      res.status(500).json({ error: 'Failed to fetch attendance details' });
    }
  };
  
  
  
  