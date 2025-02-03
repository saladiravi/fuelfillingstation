const pool=require('../db/db');
const moment=require('moment');

exports.getAttendanceByDateRange = async (req, res) => {
  try {
    const { fromDate, toDate, employee_id } = req.body;

    // Validate input
    if (!fromDate || !toDate) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Both fromDate and toDate are required',
      });
    }

    // Define the query
    let query = `
    SELECT 
      a.attendence_id,
      a.date,
      a."pumpNumber", 
      a.remarks,
      e."employeeName" AS operator_name,
      a.operatorshift,
      a.attendence,  -- Display attendance (1 or 0)
      COUNT(a.attendence) FILTER (WHERE a.attendence = 1) AS present_count,  -- Count present
      COUNT(a.attendence) FILTER (WHERE a.attendence = 0) AS absent_count,   -- Count absent
      COALESCE(ARRAY_AGG(JSON_BUILD_OBJECT('bay_side', p.bay_side)), '{}') AS pump_sales
    FROM 
      attendence a
    INNER JOIN employees e 
      ON a.operator_name = e.employee_id::TEXT  -- ✅ Ensure type match
    INNER JOIN pump_sales p
      ON a.attendence_id = p.attendence_id
    WHERE a.date BETWEEN $1 AND $2
    AND ($3::INTEGER IS NULL OR e.employee_id = $3::INTEGER)  -- ✅ Filter by employee_id
    GROUP BY 
      a.attendence_id, a.date, a."pumpNumber", a.remarks, e."employeeName", a.operatorshift, a.attendence;
    `;

    // Set query parameters
    const queryParams = [fromDate, toDate, employee_id || null];

    console.log('queryParams:', queryParams);

    // Execute query
    const attendanceDetails = await pool.query(query, queryParams);

    console.log('Attendance Details:', attendanceDetails);

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

  
  
  
  