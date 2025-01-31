const express=require("express");
const router=express.Router();
const attendenceReports=require('../Controller/attendenceReports');

router.post('/attendencereports',attendenceReports.getAttendanceByDateRange);
 


module.exports=router