const express = require("express");
const bodyparser = require("body-parser");

const router = express.Router();

router.use(bodyparser.json());

router.use("/ir", require("./ir/"));
router.use("/auth", require("./auth/"));

module.exports = router;
