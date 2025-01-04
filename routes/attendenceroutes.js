const express=require("express");
const attendenceController = require("../Controller/attendenceController")
const router=express.Router();

  router.post(
    "/addAttendence",attendenceController.addattendence
  );
  router.get("/getAttendenceDetails",attendenceController.getAttendenceDetails);
  router.put("/getAttendenceById",attendenceController.getAttendenceById);
  
  module.exports=router