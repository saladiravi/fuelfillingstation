const express=require("express");
 const router=express.Router();
const pumpSales=require('../Controller/pumpsalesController');

router.get('/getPumpDetailsbydate',pumpSales.getPumpDetailsbydate);
router.post('/addpumpSales',pumpSales.addPumpSales);
router.get('/getpumpsales',pumpSales.getTodaysPumpSales);
router.post('/getpumsalesBydate',pumpSales.getPumpSalesanydate);

module.exports=router