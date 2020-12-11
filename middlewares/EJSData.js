module.exports = async function(req, res, next)
{
    req.ejs = {
        username: req.session.user ? req.session.user.username : undefined //give me conditional chaining or give me death
    }

    //actually i think the latest LTS of node.js supports it but it's probably best not to use it so as to support older versions

    next();
}
