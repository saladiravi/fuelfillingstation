const express=require("express");
 const router=express.Router();
const pumpSales=require('../Controller/pumpsalesController');

router.get('/getPumpDetailsbydate',pumpSales.getPumpDetailsbydate);
router.post('/addpumpSales',pumpSales.addPumpSales);
router.get('/getpumpsales',pumpSales.getTodaysPumpSales);
router.post('/getpumpsalesBydate',pumpSales.getPumpSalesanydate);
router.post('/getPumpsalesSearchBydate',pumpSales.getpumsaleSearchbydate);


module.exports=router