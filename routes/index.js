const path = require("path");
const express = require("express");
const bodyparser = require("body-parser");
const express_session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(express_session);

const EJSData = require("../middlewares/EJSData.js");

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

const router = express.Router();

router.use(bodyparser.json());

//ir (i.e. usc) endpoints
router.use("/ir", require("./ir/"));

//static files
router.use(express.static(path.join("__dirname", "../client/static"), {
    etag: true,
    setHeaders: function(res, path, stat) {
        res.setHeader("Cache-Control", "max-age=0, must-revalidate");
    }
}))

//use session after ir + static because neither of those need to see our web session
router.use(session);

//everything below = webui endpoints

//prepares req.ejs base values
router.use(EJSData);

//subpaths
router.use("/auth", require("./auth/"));
router.use("/api", require("./api/"));

//direct results
router.get("/", (req, res) => res.render("index", req.ejs));
router.get("/leaderboards/chart", (req, res) => res.render("chart-leaderboards", req.ejs));
router.get("/profiles/:username", async (req, res) => {
    const username = req.params.username;

    const user_doc = await global.DB.get("users").findOne({username});
    if(!user_doc) return res.redirect("/"); //todo: 404 page

    return res.render("profile", Object.assign({profile: user_doc}, req.ejs));
})

module.exports = router;
