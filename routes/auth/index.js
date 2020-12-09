/*
    Endpoints for authentication with the Web UI component of the server.
*/

const express = require("express");
const WebAuthService = require("../services/WebAuthService.js");

const router = express.Router();

router.get("/login",    WebAuthService.Login);
router.get("/register", WebAuthService.Register);

module.exports = router;
