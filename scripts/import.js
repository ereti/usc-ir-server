const CONFIG = require("../config.json");
global.CONFIG = CONFIG;

const DB = require("../lib/db.js");

const crypto = require("crypto");
const fs = require("fs");

//no top level await :(
(async function()
{

    const folders = fs.readdirSync("./import", {encoding: "utf8", withFileTypes: true});

    const added = [];

    for(let folder of folders)
    {
        if(!folder.isDirectory()) continue;

        const files = fs.readdirSync("./import/" + folder.name);

        const kshs = files.filter(e => e.endsWith(".ksh"));

        file:
        for(let ksh of kshs)
        {
            let file_full = fs.readFileSync("./import/" + folder.name + "/" + ksh, "utf8");

            //naively skip over BOM
            let file = file_full.replace(/^[^a-z]*/, "");

            const hasher = crypto.createHash("sha1");

            hasher.update(file);

            const hash = hasher.digest("hex");

            if(await DB.get("charts").findOne({chartHash: hash}))
            {
                console.log(`skipping duplicate chart ${folder.name}/${ksh}`);
                continue file;
            }

            const lines = file.split("\r\n");

            const header = {}

            for(let line of lines)
            {
                if(line == "--") break;
                if(line.startsWith("//")) continue;

                const kv = line.split("=");
                if(kv.length != 2)
                {
                    console.log(`can't parse ${folder.name}/${ksh}`);
                    continue file;
                }

                header[kv[0]] = kv[1];
            }

            var diff = 0;
            if(header.difficulty == "challenge") diff = 1;
            if(header.difficulty == "extended") diff = 2;
            if(header.difficulty == "infinite") diff = 3;

            const chart_obj = {
                chartHash: hash,
                title: header.title,
                artist: header.artist,
                effector: header.effect,
                illustrator: header.illustrator,
                difficulty: diff,
                level: parseInt(header.level),
                bpm: header.t
            }

            added.push(DB.get("charts").insert(chart_obj));
            console.log(`added ${chart_obj.title} - ${chart_obj.artist} / ${chart_obj.level} ${["NOV", "ADV", "EXH", "MXM"][chart_obj.difficulty]} ${chart_obj.effector}`)
        }
    }

    return added
})().then(added => Promise.all(added)).then(_ => process.exit(0));
