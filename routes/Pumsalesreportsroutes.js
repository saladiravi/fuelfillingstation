const express=require("express");
const router=express.Router();
const pumpsalereports=require('../Controller/pumpsaleReports')

router.post('/pumpsalesreports',pumpsalereports.pumsalesreportsRange);


module.exports=router