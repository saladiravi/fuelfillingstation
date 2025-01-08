const express=require("express")
const RSP=require('../Controller/retailSellingPrice')
const router=express.Router();

router.post('/addsellingPrice',RSP.addsellingprice);
router.get('/getAllPrices',RSP.getallprices);
router.post('./getpriceBydate',RSP.getpricebydate);
router.put('./getPriceByid',RSP.getpricesbyid);
router.put('./getUpdatePrice',RSP.updatePrice);

