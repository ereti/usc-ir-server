/*
    API endpoints used by the web UI
*/

const express = require("express");
const WebAPIService = require("../../services/WebAPIService.js");
const WebLoggedIn = require("../../middlewares/WebLoggedIn.js");

const router = express.Router();


router.get("/charts",                   WebAPIService.QueryCharts);
router.get("/charts/:chartHash/scores", WebAPIService.ChartScores);
router.get("/players/:username/scores", WebAPIService.PlayerScores);
router.get("/token",       WebLoggedIn, WebAPIService.GetToken);
router.get("/token/reset", WebLoggedIn, WebAPIService.ResetToken);

module.exports = router;
