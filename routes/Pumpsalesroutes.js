const express=require("express");
 const router=express.Router();
const pumpSales=require('../Controller/pumpsalesController');

router.get('/getPumpDetailsbydate',pumpSales.getPumpDetailsbydate);
router.post('/addpumpSales',pumpSales.addPumpSales);

module.exports=router