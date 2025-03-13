const express=require("express");
 const router=express.Router();
const pumpSales=require('../Controller/pumpsalesController');
const upload=require('../utils/uploadfile');

router.post("/addpumpSales", (req, res, next) => {
 
    next();
  }, upload.any(), pumpSales.addPumpSales);
  
router.get('/getPumpDetailsbydate',pumpSales.getPumpDetailsbydate);
router.get('/getpumpsales',pumpSales.getTodaysPumpSales);
router.post('/getpumpsalesBydate',pumpSales.getPumpSalesanydate);
router.post('/getPumpsalesSearchBydate',pumpSales.getpumsaleSearchbydate);
router.post('/getpumpdetailsforedit',pumpSales.pumpdetailsforedit);
router.post("/updatePumpsales", (req, res, next) => {
  next();
}, upload.any(), pumpSales.updatePumpDetails);


module.exports=router