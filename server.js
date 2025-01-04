const express = require("express");
const app = express();
const employeeRoutes=require('./routes/Employeeroutes');
const attendenceRoutes=require('./routes/attendenceroutes');
const adminRoutes=require('./routes/adminroutes');

app.use(express.json())
 
app.use('/employee',employeeRoutes);
app.use('/attendence',attendenceRoutes);
app.use('/admin',adminRoutes);
app.listen(5432, () => {
    console.log("Server is running on port 5000")
})