process.env.NODE_ENV = "production";

//globals
global.CONFIG = require("./config.json");
global.DB     = require("./lib/db.js");

//packages
const express = require("express");

//express config
const app     = express();
app.set("json spaces", 2);

//routing
app.use("/ir", require("./ir/"));


app.listen(global.CONFIG.serverPort, _ => console.log(`Server listening on port ${global.CONFIG.serverPort}`));
