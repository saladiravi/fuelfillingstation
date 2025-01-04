const express=require("express");
const employeeController = require("../Controller/employeeController")
const upload=require('../utils/fileUpload');
const router=express.Router();

router.post(
    '/addemployee',
    upload.fields([
      { name: 'profileImage', maxCount: 1 },
      { name: 'aadharImage', maxCount: 1 }
    ]),
    employeeController.createEmployee
  );
  router.get('/getEmployees',employeeController.getallEmployees);
  router.put("/employeebyid",employeeController.getEmployeeById);
  
  module.exports=router