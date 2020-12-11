/*
    API endpoints used by the web UI
*/

const express = require("express");
const WebAPIService = require("../../services/WebAPIService.js");

const router = express.Router();


router.get("/charts",                   WebAPIService.QueryCharts);
router.get("/charts/:chartHash/scores", WebAPIService.ChartScores);

module.exports = router;
