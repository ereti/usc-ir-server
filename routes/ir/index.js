/*
    IR endpoints, i.e. those endpoints that will be communicated with by USC.
*/

const express = require("express");
const IRService = require("../../services/IRService.js");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: "replays/"
});

const upload = multer({storage, limits: {files: 1, fileSize: 512 * 1024}}) //512kb

const router = express.Router();

router.use(IRService.Authorize);

router.get("/",                                     IRService.Heartbeat);
router.get("/charts/:chartHash",                    IRService.ChartTracked);
router.get("/charts/:chartHash/record",             IRService.Record);
router.get("/charts/:chartHash/leaderboard",        IRService.Leaderboard);
router.post("/score/submit",                        IRService.SubmitScore);

router.post("/replays", upload.single("replay"),    IRService.SubmitReplay);

module.exports = router;
