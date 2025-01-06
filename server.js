const express = require("express");
const path = require("path"); // Import the path module
const cors = require("cors");

const employeeRoutes = require('./routes/Employeeroutes');
const attendenceRoutes = require('./routes/attendenceroutes');
const adminRoutes = require('./routes/adminroutes');

const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files
app.use(express.json());
app.use(cors());

app.use('/employee', employeeRoutes);
app.use('/attendence', attendenceRoutes);
app.use('/admin', adminRoutes);

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});
