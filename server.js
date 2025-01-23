const express = require("express");
const path = require("path"); // Import the path module
const cors = require("cors");

const employeeRoutes = require('./routes/Employeeroutes');
const attendenceRoutes = require('./routes/attendenceroutes');
const adminRoutes = require('./routes/adminroutes');
const respRoutes=require('./routes/retailSellingPrice');
const pumpsalesRoutes=require('./routes/Pumpsalesroutes');

const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files
app.use(express.json());
app.use(cors());

app.use('/employee', employeeRoutes);
app.use('/attendence', attendenceRoutes);
app.use('/admin', adminRoutes);
app.use('/res',respRoutes);
app.use('/pumpsales',pumpsalesRoutes);

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});
