const express = require("express");
const bodyparser = require("body-parser");

const router = express.Router();

router.use(bodyparser.json());

router.use("/ir", require("./ir/"));
router.use("/auth", require("./auth/"));

router.get("/", (req, res) => res.render("index", {username: req.session.user.username}));

module.exports = router;
