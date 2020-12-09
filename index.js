process.env.NODE_ENV = "production";

//globals
global.CONFIG = require("./config.json");
global.DB     = require("./lib/db.js");

//packages
const express = require("express");
const express_session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(express_session);

//express config
const app     = express();
app.set("json spaces", 2);
app.set("view engine", "ejs")
if(global.CONFIG.https)
    app.set("trust proxy", "loopback"); //trust proxy for https.
                                        //if you are having problems with cookies not being set, you're probably doing something more complicated
                                        //and need to adjust this: e.g. the reverse proxy being on a non-local IP

//session config
const session = express_session({
    name: "webui_session",
    secret: global.CONFIG.webUICookieSecret,
    store: new MongoDBStore({
        uri: `mongodb://${global.CONFIG.database}/uscir`,
        collection: "sessions"
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: global.CONFIG.https, //can't use secure if not using https
        maxAge: 1000 * 60 * 60 * 24 * 7 * 4 //1 month
    }
})

//app setup
app.use(session);
app.use(require("./routes/"));

//start listening
app.listen(global.CONFIG.serverPort, _ => console.log(`Server listening on port ${global.CONFIG.serverPort}`));
