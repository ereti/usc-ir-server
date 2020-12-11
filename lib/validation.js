class Validation
{
    ScoreObject(score)
    {
        if(!score) return false;
        if(typeof score != "object") return false;

        if(!("score" in score)) return false;
        if(typeof score.score != "number") return false;
        if(score.score < 0 || score.score > 10000000) return false;

        if(!("gameflags" in score)) return false;
        if(typeof score.gameflags != "number") return false;
        if(score.gameflags < 0 || score.gameflags > 63) return false;

        //reject scores that use autoplay
        if(score.gameflags & 0b111000 != 0) return false;

        if(!("gauge" in score)) return false;
        if(typeof score.gauge != "number") return false;
        if(score.gauge < 0 || score.gauge > 1) return false;

        if(!("timestamp" in score)) return false;
        if(typeof score.timestamp != "number") return false;
        //todo: reject scores that are too far in the future or past?

        //todo: take in chart object and ensure crit + near + error == maxCombo?
        //we do not currently store maxCombo though.
        if(!("crit" in score)) return false;
        if(typeof score.crit != "number") return false;
        if(score.crit < 0) return false;

        if(!("near" in score)) return false;
        if(typeof score.near != "number") return false;
        if(score.near < 0) return false;

        if(!("error" in score)) return false;
        if(typeof score.error != "number") return false;
        if(score.error < 0) return false;

        if(!("windows" in score)) return false;
        if(typeof score.windows != "object") return false;

        for(let key in global.CONFIG.typicalWindows)
        {
            if(!(key in score.windows)) return false;
            if(typeof score.windows[key] != "number") return false;
            if(!global.CONFIG.acceptAtypicalWindows && score.windows[key] != global.CONFIG.typicalWindows[key]) return false;
        }

        return true;
    }

    ChartObject(chart)
    {
        if(!chart) return false;
        if(typeof chart != "object") return false;

        if(!("chartHash") in chart) return false;
        if(typeof chart.chartHash != "string") return false;

        //todo: sanity checks on length for string fields? sanity check on characters like newlines? unicode RTL? etc
        if(!("artist" in chart)) return false;
        if(typeof chart.artist != "string") return false;

        if(!("title" in chart)) return false;
        if(typeof chart.title != "string") return false;

        if(!("level" in chart)) return false;
        if(typeof chart.level != "number") return false;
        if(!Number.isInteger(chart.level)) return false;
        if(chart.level < 1 || chart.level > 20) return false;

        if(!("difficulty" in chart)) return false;
        if(![0, 1, 2, 3].includes(chart.difficulty)) return false;

        if(!("effector" in chart)) return false;
        if(typeof chart.effector != "string") return false;

        if(!("illustrator" in chart)) return false;
        if(typeof chart.illustrator != "string") return false;

        //todo: format check here w/ regex
        if(!("bpm" in chart)) return false;
        if(typeof chart.bpm != "string") return false;

        return true;
    }

    Username(username)
    {
        if(typeof username !== "string") return false;
        if(username.length < 2 || username.length > 10) return false;
        for(let c of username) if(!global.CONFIG.allowedUsernameCharacters.includes(c)) return false;

        return true;
    }

    Password(password)
    {
        if(typeof password !== "string") return false;
        if(password.length < 8) return false;
        if(password.length > 50) return false; //sanest limit given max length supported by bcrypt

        return true;
    }
}

module.exports = new Validation() //nicest way to export all functions without having to remember to write the name down here every time you add one
