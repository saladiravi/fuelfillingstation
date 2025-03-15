const pool=require('../db/db');
const moment=require('moment');

 
exports.pumsalesreportsRange = async (req, res) => {
    try {
        let { fromDate, toDate, employee_name } = req.body;  

        if (!fromDate || !toDate || !employee_name) {
            return res.status(400).json({
                statuscode: 400,
                message: "From date, to date, and employee name are required."
            });
        }

        const query = `
        SELECT DISTINCT ON (e.employee_id) ps.pump_sale_id, ps.bay_side, ps.fuel_type, ps.created_at, 
               a."pumpNumber", a.operatorshift, e."employeeName", a.attendence_id, e.employee_id,psd.plus_amount,psd.short_amount,psd.shift_sales_amount,psd.pump_sale_amount
        FROM pump_sales ps
        JOIN attendence a ON ps.attendence_id = a.attendence_id
        JOIN employees e ON a.operator_name = e.employee_id
        WHERE ps.created_at BETWEEN $1 AND $2
          AND e."employeeName" ILIKE $3
        ORDER BY e.employee_id, ps.created_at DESC
      `;

        const values = [fromDate, toDate, `%${employee_name}%`]; // Use ILIKE for case-insensitive search

        const result = await pool.query(query, values);

    
        if (result.rows.length > 0) {
            res.status(200).json({
                statuscode: 200,
                message: "Pump sales fetched successfully",
                employees: result.rows
            });
        } else {
            res.status(404).json({
                statuscode: 404,
                message: "No pump sales found for the specified date range and employee.",
                employees: []
            });
        }
    } catch (error) {
        console.error("Error fetching pump sales:", error);
        res.status(500).json({
            statuscode: 500,
            message: "Internal server error",
            error: error.message
        });
    }
};

