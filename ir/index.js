const express = require("express");
const bodyparser = require("body-parser");

const IRService = require("../services/IRService.js");

const router = express.Router();

router.use(bodyparser.json());
router.use(IRService.Authorize);

//Heartbeat
router.get("/",                         IRService.Heartbeat);
router.get("/charts/:chartHash",        IRService.ChartTracked);
router.get("/charts/:chartHash/record", IRService.Record);
router.get("/score/submit",             IRService.SubmitScore);

module.exports = router;
