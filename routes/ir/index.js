/*
    IR endpoints, i.e. those endpoints that will be communicated with by USC.
*/

const express = require("express");
const IRService = require("../services/IRService.js");

const router = express.Router();

router.use(IRService.Authorize);

router.get("/",                         IRService.Heartbeat);
router.get("/charts/:chartHash",        IRService.ChartTracked);
router.get("/charts/:chartHash/record", IRService.Record);
router.post("/score/submit",            IRService.SubmitScore);

module.exports = router;
