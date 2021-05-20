const Validation = require("../lib/validation.js");
const monk = require("monk");
const VERSION = "v0.2.0-a"; //current USC-IR version implemented below
const DEFAULT_LEADERBOARD_N = 5;

async function WillTrack(hash) 
{
    let chart = await global.DB.get("charts").findOne({chartHash: hash});

    //if acceptNewCharts is true, we will accept scores on this chart even though we don't currently track it,
    //so we should respond with 20
    if(!chart && !global.CONFIG.acceptNewCharts) return false;

    //for administration later
    if(chart && chart.banned) return false;

    return true;
}

//note: the score returned from this does not have ranking, because that should be dynamically generated elsewhere
//it also does not have username, because we want to store that outside the score object logically in our db
function ScoreObjectToServerScore(score) 
{
    const GaugeNames = ["NORMAL", "HARD"]
    let ServerScore = {};

    ServerScore.score = score.score;

    //lamp
    {
        if(score.score == 10000000) ServerScore.lamp = 5;
        else if(score.error == 0) ServerScore.lamp = 4;
        //hard gauge
        else if((score.options.gaugeType === 1) && score.gauge > 0) ServerScore.lamp = 3;
        else if(score.gauge >= 0.70) ServerScore.lamp = 2;
        else ServerScore.lamp = 1
    }

    ServerScore.timestamp = score.timestamp;

    ServerScore.crit = score.crit;
    ServerScore.near = score.near;
    ServerScore.error = score.error;

    ServerScore.gaugeMod = GaugeNames[score.options.gaugeType];

    //notemod
    {
        let random = score.options.random;
        let mirror = score.options.mirror;

        if(random & mirror) ServerScore.noteMod = "MIR-RAN";
        else if(random) ServerScore.noteMod = "RANDOM";
        else if(mirror) ServerScore.noteMod = "MIRROR";
        else ServerScore.noteMod = "NORMAL"
    }

    return ServerScore;
}

class IRService {
    //Middleware to authenticate the provided token and return a 41/43 if necessary.
    //On success, calls next while also setting user on req for use further down the line.
    async Authorize(req, res, next) 
    {
        let authHeader = req.header("Authorization");

        if(!authHeader) return res.json({statusCode: 41, description: "No authorization header provided."});

        if(!authHeader.startsWith("Bearer ")) return res.json({statusCode: 41, description: "Bad authorization header structure."});

        let token = authHeader.split(" ")[1];

        let userDoc = await global.DB.get("users").findOne({token});

        if(!userDoc) return res.json({statusCode: 41, description: "Invalid authorization token provided."});
        if(userDoc.banned) return res.json({statusCode: 43, description: "This token has been banned."});

        req.user = userDoc;

        return next();
    }

    async Heartbeat(req, res) 
    {
        return res.json({
            statusCode: 20,
            description: "Heartbeat acknowledged.",
            body: {
                serverTime: Math.floor(Date.now() / 1000),
                serverName: global.CONFIG.serverName,
                irVersion : VERSION
            }
        });
    }

    async ChartTracked(req, res) 
    {
        let hash = req.params.chartHash;

        if(!await WillTrack(hash)) return res.json({statusCode: 42, description: "IR will not track this chart."});

        return res.json({
            statusCode: 20,
            description: chart ? "IR is tracking this chart." : "IR will accept a score on this chart.",
            body: {}
        })
    }

    async Record(req, res) 
    {
        let hash = req.params.chartHash;

        if(!await WillTrack(hash)) return res.json({statusCode: 42, description: "IR will not track this chart."});

        let record = await global.DB.get("scores").findOne({
            chartHash: hash,
            isUserPB: true
        }, {
            sort: {
                "score.score": -1
            }
        });

        if(!record) return res.json({
            statusCode: 44,
            description: "No record."
        });

        return res.json({
            statusCode: 20,
            description: "",
            body: {
                record: Object.assign(record.score, {username: record.username, ranking: 1})
            }
        });
    }

    async SubmitScore(req, res) 
    {
        let chart = req.body.chart;
        let score = req.body.score;


        if(!Validation.ScoreObject(score)) return res.json({statusCode: 40, description: "Score object was malformed."});
        if(!Validation.ChartObject(chart)) return res.json({statusCode: 40, description: "Chart object was malformed."});

        let hash = chart.chartHash;

        if(!await WillTrack(hash)) return res.json({statusCode: 42, description: "IR will not track this chart."});

        //at this point we will accept the score

        let chartDoc = await global.DB.get("charts").findOne({chartHash: hash});

        //if chartDoc is not found, but we have accepted the score, then acceptNewCharts must be true and we must insert it
        if(!chartDoc) await global.DB.get("charts").insert(chart); //safe because we've already validated it

        //note: the below is not very efficient. this is intentional, as the goal is to be readable.
        //some attempt is made to reuse data when it is logical, however this is generally avoided for the sake
        //of readability.

        //also, the following convention is used:
        //variables ending in Doc represent documents stored in the "scores" table.
        //variables ending in SS represent Server Scores, i.e. objects which are ready to be sent out.
        //otherwise, assuming it is not obvious (e.g. boolean), variables represent .score objects (i.e. lacking username/ranking, those stored in the db)

        //note, this is not an SS because it does not have username or ranking.
        //these must be added before something can be an SS.
        let serverScore = ScoreObjectToServerScore(score);

        let dbScoreInsert = {
            username: req.user.username,
            chartHash: hash,
            isUserPB: false,
            score: serverScore
        }

        //step 1a: establish requesting user's new pb.
        let newPB = null;

        let currentPBDoc = await global.DB.get("scores").findOne({
            username: req.user.username,
            chartHash: hash,
            isUserPB: true
        });

        //step 5 (just makes sense to be established here)
        let isNewPB = !currentPBDoc || serverScore.score >= currentPBDoc.score.score;

        if(isNewPB) 
        {
            dbScoreInsert.isUserPB = true;

            newPB = Object.assign({}, serverScore);

            if(currentPBDoc) //set old pb as no longer pb in database
            {
                await global.DB.get("scores").update({ //set old pb as no longer pb
                    _id: currentPBDoc._id
                }, {
                    $set: {
                        isUserPB: false
                    }
                });
            }
        }
        else newPB = currentPBDoc.score;

        //step 1b: attach ranking and username to this new pb to promote it to an SS.
        let newPBSS = null;

        let betterThanPBDocs = await global.DB.get("scores").find({
            chartHash: hash,
            username: {$ne: req.user.username}, //satisfies key assumption #4
            isUserPB: true, //satisfies key assumption #3
            "score.score": {$gt: newPB.score}
        }, {
            sort: {
                "score.score": -1
            }
        });

        let newPBRanking = betterThanPBDocs.length + 1;

        newPBSS = Object.assign({}, newPB, {username: req.user.username, ranking: newPBRanking});


        //step 2: establish server record.
        let serverRecordSS = null;

        //note: it's not important that we avoid fetching our own scores here.
        let currentRecordDoc = await global.DB.get("scores").findOne({
            chartHash: hash,
            isUserPB: true
        }, {
            sort: {
                "score.score": -1
            }
        });

        //step 6 (just makes sense to be established here)
        let isServerRecord = !currentRecordDoc || serverScore.score >= currentRecordDoc.score.score;

        if(isServerRecord) serverRecordSS = Object.assign({}, serverScore, {username: req.user.username, ranking: 1});
        else serverRecordSS = Object.assign({}, currentRecordDoc.score, {username: currentRecordDoc.username, ranking: 1});

        //step 3: establish adjacentAbove.
        let adjacentAboveSS = null;

        //reuse our previous data here
        let adjacentAboveDocs = betterThanPBDocs.slice(-global.CONFIG.adjacentRecordsN);
        if(currentRecordDoc && adjacentAboveDocs[0] && adjacentAboveDocs[0]._id.toString() == currentRecordDoc._id.toString()) adjacentAboveDocs.shift() //satisfies key assumption #1
        //note: in the case where this score is the new record, adjacentAboveDocs will be empty anyway,
        //so there's no need for us to care about this case and add a check for it

        adjacentAboveSS = adjacentAboveDocs.map((e, i) => {
            let ret = e.score;
            ret.username = e.username;
            ret.ranking = newPBRanking - adjacentAboveDocs.length + i;

            return ret;
        })

        //step 4: establish adjacentBelow
        let adjacentBelowSS = null;

        let adjacentBelowDocs = await global.DB.get("scores").find({
            chartHash: hash,
            username: {$ne: req.user.username}, //satisfies key assumption #4
            isUserPB: true, //satisfies key assumption #3
            "score.score": {$lte: serverScore.score}
        }, {
            sort: {
                "score.score": -1
            },
            limit: global.CONFIG.adjacentRecordsN
        });

        adjacentBelowSS = adjacentBelowDocs.map((e, i) => {
            let ret = e.score;
            ret.username = e.username;
            ret.ranking = newPBRanking + i + 1;

            return ret;
        })

        //don't forget to insert our score
        let insert = await global.DB.get("scores").insert(dbScoreInsert);

        //finally, put it all together.
        let response = {
            score: newPBSS,
            serverRecord: serverRecordSS,
            adjacentAbove: adjacentAboveSS,
            adjacentBelow: adjacentBelowSS,
            isPB: isNewPB,
            isServerRecord: isServerRecord,
            sendReplay: isServerRecord ? insert._id.toString() : false //only take replays for new records because we're only going to send them out for records too
        };

        return res.json({
            statusCode: 20,
            description: "",
            body: response
        })
    }

    async SubmitReplay(req, res) 
    {
        let score_id = req.body.identifier;
        let replay = req.file;

        if(!score_id || !replay) return res.json({
            statusCode: 40,
            description: "Identifier or replay were not provided"
        });

        let score_obj = await global.DB.get("scores").findOne({_id: monk.id(score_id), username: req.user.username});

        if(!score_obj) return res.json({
            statusCode: 44,
            description: "Identifier did not identify one of your scores"
        });

        if(score_obj.replay_path) return res.json({
            statusCode: 40,
            description: "Score already has a replay"
        })

        await global.DB.get("scores").update({_id: score_obj._id}, {$set: {replay_path: req.file.path}});

        return res.json({
            statusCode: 20,
            description: "",
            body: {}
        });
    }

    async Leaderboard(req, res) 
    {
        let mode = req.query.mode;
        let hash = req.params.chartHash;
        let n = ("n" in req.query) ? parseInt(req.query.n) : DEFAULT_LEADERBOARD_N;

        if(isNaN(n) || n < 0) 
        {
            return res.json({
                statusCode: 40,
                description: "Bad n provided."
            })
        }

        if(!mode) return res.json({
            statusCode: 40,
            description: "No mode provided."
        })

        if(!["best", "rivals"].includes(mode)) return res.json({
            statusCode: 40,
            description: "Bad mode provided."
        })

        if(!await WillTrack(hash)) return res.json({
            statusCode: 42,
            description: "IR will not track this chart."
        })

        const chart_doc = await global.DB.get("charts").findOne({chartHash: hash});

        if(!chart_doc) return res.json({
            statusCode: 44,
            description: "Chart is not tracked."
        });

        if(mode == "best") 
        {
            const scores = await global.DB.get("scores").find({chartHash: hash, isUserPB: true}, {sort: {"score.score": -1}, limit: n});

            const serverscores = scores.map((e, i) => {
                let ret = e.score;
                ret.username = e.username;
                ret.ranking = i+1;

                return ret;
            });

            return res.json({
                statusCode: 20,
                description: "",
                body: {scores: serverscores}
            })
        }
        else 
        {
            return res.json({
                statusCode: 50, //we don't have an Unimplemented code so whatever
                description: "Server does not support this mode"
            })
        }
    }
}



module.exports = new IRService();
