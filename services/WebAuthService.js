const Validation = require("../lib/validation.js");
const bcrypt = require("bcrypt");

class WebAuthService
{
    async Login(req, res)
    {
        const user = req.session.user;

        if(user) return res.status(400).json({invalid: "username", error: "Already logged in."});

        const username = req.body.username;
        const password = req.body.password;

        if(!Validation.Username(username)) return res.status(400).json({invalid: "username", error:"Username must be 2-10 characters, and use only these characters: " + global.CONFIG.allowedUsernameCharacters});
        if(!Validation.Password(password)) return res.status(400).json({invalid: "password", error:"Password must be 8-50 characters."});

        const user_doc = await global.DB.get("users").findOne({username: username});
        if(!user_doc) return res.status(401).json({invalid: "username", error: "User doesn't exist."});

        const correct_password = await bcrypt.compare(password, user_doc.password_hash);

        if(!correct_password) return res.status(401).json({invalid: "password", error:"Incorrect password."});

        req.session.user = {username: user_doc.username};

        return res.status(204).end();
    }

    async Register(req, res)
    {
        const user = req.session.user;

        if(user) return res.status(400).json({invalid: "username", error:"Already logged in."});

        const username = req.body.username;
        const password = req.body.password;

        if(!Validation.Username(username)) return res.status(400).json({invalid: "username", error:"Username must be 2-10 characters, and use only these characters: " + global.CONFIG.allowedUsernameCharacters});
        if(!Validation.Password(password)) return res.status(400).json({invalid: "password", error:"Password must be 8-50 characters."});

        const user_doc = await global.DB.get("users").findOne({username: username});
        if(user_doc) return res.status(409).json({invalid: "username", error:"Username already taken."});

        const hash = await bcrypt.hash(password, global.CONFIG.hashWorkFactor);

        const user_profile = {
            username: username,
            password_hash: hash,
            registered_at: Date.now(),
        };

        await global.DB.get("users").insert(user_profile);

        return res.status(204).end();
    }

    async Logout(req, res)
    {
        req.session.destroy();

        return res.redirect("/");
    }
}

module.exports = new WebAuthService()
