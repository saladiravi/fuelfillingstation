const express=require("express");
const employeeController = require("../Controller/employeeController")
const upload=require('../utils/fileUpload');
const router=express.Router();

router.post(
  '/addemployee',
  upload.fields([
    { name: 'aadhar_Image', maxCount: 1 },
    { name: 'profile_image', maxCount: 1 },
    {name: 'aadhar_backsideimage',maxCount:1}
  ]),
  employeeController.createEmployee
);

router.get('/getEmployees',employeeController.getallEmployees);
router.post("/employeebyid",employeeController.getEmployeeById);
router.put(
    '/employeeid',
    upload.fields([
      { name: 'aadhar_Image', maxCount: 1 },
      { name: 'profile_image', maxCount: 1 },
      {name:'aadhar_backsideimage',maxCount:1}
    ]),
    employeeController.updateEmployee
  );
  
 module.exports=router