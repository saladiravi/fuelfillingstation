const adminController=require('../Controller/adminController');
const express=require('express');
const router=express.Router();

router.post('/register',adminController.register);
router.get('/adminlogin',adminController.adminLogin);

module.exports=router