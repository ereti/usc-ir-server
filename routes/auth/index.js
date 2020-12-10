/*
    Endpoints for authentication with the Web UI component of the server.
*/

const express = require("express");
const WebAuthService = require("../../services/WebAuthService.js");

const router = express.Router();

router.post("/login",    WebAuthService.Login);
router.post("/register", WebAuthService.Register);
router.get("/logout",    WebAuthService.Logout);

module.exports = router;
