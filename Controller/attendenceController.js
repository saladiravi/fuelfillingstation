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

  exports.updateAttendence=async(req,res)=>{
    try{
        const {date,operator_name,operatorshift,pumpNumber,bay_side,attendece,remarks}=req.body
        const values=[];
        const fields=[];

        let index=1;
        if(date){
          fields.push(`"date"= $${index++}`);
          values.push(date);
        }
        if(operator_name){
          fields.push(`"operator_name"=$${index++}`);
          values.push(operator_name);
        }
        if(operatorshift){
          fields.push(`"operatorshift"=$${index++}`);
          values.push(operatorshift);
        }
        if(pumpNumber){
          fields.push(`"pumpNumber"$${index++}`);
          values.push(pumpNumber)
        }
        if(bay_side){
          fields.push(`"bay_side"=$${index++}`);
          values.push(bay_side)
        }

        if(attendece){
          fields.push(`"attendence"=$${index++}`);
          values.push(attendece)
        }
        if(remarks){
          fields.push(`"remarks"=$${index++}`);
          values.push(remarks)
        }
         
        values.push(attendence_id);
        if(fields.length===0){
          res.status(400).json({
            statusCode:400,
            message:'No Fileds provided to update'
          })
        }

       const query=`
       UPDATE retailsellingprice
       SET ${fileds.json(', ')}
       WHERE "attendence_id"= $${index}
       RETURNING *;`;

       const result=await pool.query(query,values);
       if(result.rowCount===0){
        return res.status(400).json({
          statusCode:400,
          message:"Attendence not Found",
           
        })
        }
       res.status(200).json({
        statusCode:200,
        message:'Updated Sucessfully',
        attendence:result.rows[0],
       })
    }catch(err){
      res.status(500).json({error:'failed to update attendence'})
    }
  }
  
  