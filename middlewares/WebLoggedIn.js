module.exports = async function(req, res, next)
{
    const user = req.session.user;

    if(!user) {
        if(req.method == "GET") return res.redirect("/"); //todo: 404 error page
        else if(req.method == "POST") return res.status(401).json({error: "You need to be logged in to access this."});
        else return res.status(401).end();
    }

    return next();
}
