const pool = require('../db/db');
const path = require('path');

exports.createEmployee = async (req, res) => {
  try {
    const {
      employeeName,
      phoneNumber,
      mobileNumber,
      aadharno,
      date,
      Taddress,
      Paddress,
      statusname,
    } = req.body;

    const profileImage = req.files?.profile_image?.[0]?.filename
  ? `/uploads/${req.files.profile_image[0].filename}`
  : null;

const aadharImage = req.files?.aadhar_Image?.[0]?.filename
  ? `/uploads/${req.files.aadhar_Image[0].filename}`
  : null;
  
  const aadharbackside = req.files?.aadhar_backsideimage?.[0]?.filename
  ?`/uploads/${req.files.aadhar_backsideimage[0].filename}`:null;

 
  
    const emp = await pool.query(
      `INSERT INTO employees(
        "employeeName", "phoneNumber", "mobileNumber", "aadharno", 
        "aadhar_Image", "profile_image","aadhar_backsideimage","date", "Taddress", "Paddress", "statusname"
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11) RETURNING *`,
      [employeeName, phoneNumber, mobileNumber, aadharno, aadharImage, profileImage,aadharbackside, date, Taddress, Paddress, statusname]
    );

    res.status(200).json({
      statusCode: 200,
      message: 'Employee created successfully',
      employee: emp.rows[0],
    });
  } catch (err) {
   
    res.status(500).json({ error: 'Failed to insert employee' });
  }
};


exports.getallEmployees=async (req,res)=>{
try{
  const allemp=await pool.query("SELECT * FROM employees");
  res.status(200).json({
    statusCode: 200,
    message: 'Employees fetched successfully',
    employees: allemp.rows,  
  });
}catch(err){
  
    res.status(500).json({error:'failed'})
}
}

exports.getEmployeeById = async (req, res) => {
  try {
     
    const { employee_id } = req.body;  

    
    const empById = await pool.query(
      "SELECT * FROM employees WHERE employee_id = $1",
      [employee_id]
    );
 
    if (empById.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Employee fetched successfully',
      employee: empById.rows[0],  
    });
  } catch (err) {
   
    res.status(500).json({ error: "fail" });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      phoneNumber,
      mobileNumber,
      aadharno,
      address,
      date,
      Taddress,
      Paddress,
      statusname
    } = req.body;

    const profileImage = req.files?.aadhar_Image?.[0]?.path.replace(/\\/g, '/') || null;
    const aadharImage = req.files?.profile_image?.[0]?.path.replace(/\\/g, '/') || null;

    // Build the query dynamically to update only provided fields
    const fields = [];
    const values = [];
    let index = 1;

    if (employeeName) {
      fields.push(`"employeeName" = $${index++}`);
      values.push(employeeName);
    }
    if (phoneNumber) {
      fields.push(`"phoneNumber" = $${index++}`);
      values.push(phoneNumber);
    }
    if (mobileNumber) {
      fields.push(`"mobileNumber" = $${index++}`);
      values.push(mobileNumber);
    }
    if (aadharno) {
      fields.push(`"aadharno" = $${index++}`);
      values.push(aadharno);
    }
    if (address) {
      fields.push(`"address" = $${index++}`);
      values.push(address);
    }
    if (date) {
      fields.push(`"date" = $${index++}`);
      values.push(date);
    }
    if (Taddress) {
      fields.push(`"Taddress" = $${index++}`);
      values.push(Taddress);
    }
    if (Paddress) {
      fields.push(`"Paddress" = $${index++}`);
      values.push(Paddress);
    }
    if (statusname) {
      fields.push(`"statusname" = $${index++}`);
      values.push(statusname);
    }
    if (profileImage) {
      fields.push(`"profile_image" = $${index++}`);
      values.push(profileImage);
    }
    if (aadharImage) {
      fields.push(`"aadhar_Image" = $${index++}`);
      values.push(aadharImage);
    }

    // Add the employeeId for the WHERE clause
    values.push(employeeId);

    if (fields.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: 'No fields provided to update',
      });
    }

    const query = `
      UPDATE employees
      SET ${fields.join(', ')}
      WHERE "employee_id" = $${index}
      RETURNING *;
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Employee not found',
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Employee updated successfully',
      employee: result.rows[0],
    });
  } catch (err) {
  
    res.status(500).json({ error: 'Failed to update employee' });
  }
};


