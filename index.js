process.env.NODE_ENV = "production";

//globals
global.CONFIG = require("./config.json");
global.DB     = require("./lib/db.js");

//packages
const express = require("express");

//express config
const app     = express();

app.set("json spaces", 2);
app.set("view engine", "ejs")
app.set("views", "./client/views/pages");

app.locals.CONFIG = global.CONFIG;

if(global.CONFIG.https)
    app.set("trust proxy", "loopback"); //trust proxy for https.
                                        //if you are having problems with cookies not being set, you're probably doing something more complicated
                                        //and need to adjust this: e.g. the reverse proxy being on a non-local IP

//app setup
app.use(require("./routes/"));

//start listening
app.listen(global.CONFIG.serverPort, _ => console.log(`Server listening on port ${global.CONFIG.serverPort}`));
