const monk = require("monk");
const db   = monk(global.CONFIG.database + "/uscir");

module.exports = db;
