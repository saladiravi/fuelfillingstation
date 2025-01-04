const pool = require('../db/db');

exports.createEmployee = async (req, res) => {
  try {
    const {
      employeeName,
      phoneNumber,
      mobileNumber,
      aadharno,
      address,
    } = req.body;

    const profileImage = req.files?.profileImage?.[0]?.path.replace(/\\/g, '/') || null;
    const aadharImage = req.files?.aadharImage?.[0]?.path.replace(/\\/g, '/') || null;

   const emp = await pool.query(
      `INSERT INTO employees(
        "employeeName", "phoneNumber", "mobileNumber", "aadharno", 
        "aadhar_Image", "profile_image", "address"
      ) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [employeeName, phoneNumber, mobileNumber, aadharno, aadharImage, profileImage, address]
    );

    res.json(emp.rows[0]);
  } catch (err) {
    console.error('Error inserting employee:', err.message);
    res.status(500).json({ error: 'Failed to insert employee' });
  }
};

exports.getallEmployees=async (req,res)=>{
try{
  const allemp=await pool.query("SELECT * FROM employees");
  res.json(allemp.rows);
}catch(err){
    console.log(err);
    res.status(500).json({error:'failed'})
}
}

exports.getEmployeeById = async (req, res) => {
  try {
     
    const { employee_id } = req.query;  

    
    const empById = await pool.query(
      "SELECT * FROM employees WHERE employee_id = $1",
      [employee_id]
    );
 
    if (empById.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

     
    res.json(empById.rows[0]);
  } catch (err) {
    console.error("Error fetching employee by ID:", err);
    res.status(500).json({ error: "fail" });
  }
};

