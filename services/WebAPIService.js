class WebAPIService
{
    async QueryCharts(req, res)
    {
        const query = req.query.query; //lol

        if(!query) return res.status(400).json({error:"No query provided."}); //don't just return all the charts because that might become a LOT of data. could change this though
        if(typeof query != "string") return res.status(400).json({error:"Bad query provided."});

        let search_query;

        try {
            search_query = new RegExp(`${query}`, "i");
        } catch(e) {
            return res.status(400).json({error:"Bad query provided."});
        }

        const results = await global.DB.get("charts").find({
            $or: [
                {title: search_query},
                {artist: search_query},
                {effector: search_query}
            ]
        });

        return res.status(200).json(results);
    }

    async ChartScores(req, res)
    {
        let hash = req.params.chartHash;

        let chart_doc = await global.DB.get("charts").findOne({chartHash: hash});

        if(!chart_doc) return res.status(404).json({error:"Chart not found."});

        let pbs = await global.DB.get("scores").find({
                chartHash: hash,
                isUserPB: true
        }, {
                sort: {
                    "score.score": -1
                }
        });

        return res.status(200).json(pbs);
    }

    async GetToken(req, res)
    {
        let user = req.session.user;

        let user_doc = await global.DB.get("users").findOne({username: user.username});

        return res.status(200).json({token: user_doc.token});
    }
}

module.exports = new WebAPIService();
