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
}

module.exports = new WebAPIService();
