const express = require("express");
const path = require("path"); // Import the path module
const cors = require("cors");

const employeeRoutes = require('./routes/Employeeroutes');
const attendenceRoutes = require('./routes/attendenceroutes');
const adminRoutes = require('./routes/adminroutes');
const respRoutes=require('./routes/retailSellingPrice');
const pumpsalesRoutes=require('./routes/Pumpsalesroutes');
const pumpsalereports=require('./routes/Pumsalesreportsroutes');
const attendenceReports=require('./routes/attendencereportroutes');


const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello, your Node.js server is working!");
});


app.use('/employee', employeeRoutes);
app.use('/attendence', attendenceRoutes);
app.use('/admin', adminRoutes);
app.use('/res',respRoutes);
app.use('/pumpsales',pumpsalesRoutes);
app.use('/reports',pumpsalereports);
app.use('/reports',attendenceReports);

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});
