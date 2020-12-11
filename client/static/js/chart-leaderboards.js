const search_box = document.getElementById("search-box");
const scores_body = $("#scores-body");
const wait_time_ms = 250;
let last_timeout = null;
let last_modified = 0;
let diff_names = ["nov", "adv", "exh", "mxm"];
let no_results = $(`<div class="col-12" style="text-align: center;">Looks like there are no results for that search.</div>`);
let chart_hash_to_chart = {

};

const params = new URLSearchParams(window.location.search);

$(document).ready(_  => {
    if(params.has("hash"))
    {
        fetch("/api/charts?hash=" + params.get("hash"))
        .then(res => {
            if(!res.ok) console.log(res.json());
            else res.json().then(chart => {
                chart_hash_to_chart[chart.chartHash] = chart;

                load_leaderboard(chart.chartHash);
            });
        })
    }
})


function create_record_row(score)
{
    var row = $(`<tr></tr>`);

    row.append($(`<td><a href="/profiles/${score.username}">${score.username}</a></td>`)); //username
    row.append($(`<td>${score.score.score}</td>`)); //score
    row.append($(`<td>todo</td>`)); //grade
    row.append($(`<td>todo</td>`)); //lamp
    row.append($(`<td>${score.score.crit}</td>`)) //crit
    row.append($(`<td>${score.score.near}</td>`));
    row.append($(`<td>${score.score.error}</td>`));

    return row;
}

function create_song_dom(song)
{
    let song_dom = $(`<div class="song"></div>`);
    song_dom.append($(`<img class="song-jacket" src="/img/defaultjacket.png">`));

    let data = $(`<div class="song-data"></div>`);

    let info = $(`<div class="song-info"></div>`);
    info.append($(`<span class="title">${song.title}</span>`));
    info.append($(`<span class="artist">${song.artist}</span>`));

    data.append(info);

    let charts = $(`<div class="song-charts"></div>`);

    for(let chart of song.charts)
    {
        //kinda ugly but works ok
        //could be a problem if we have two identical charts with different names though...
        //todo: think about that
        chart_hash_to_chart[chart.chartHash] = chart;

        let chart_dom = $(`<a href="#" onclick="load_leaderboard('${chart.chartHash}')" class="${diff_names[chart.difficulty]} song-chart"> </div>`);

        chart_dom.append($(`<div class="level">${diff_names[chart.difficulty].toUpperCase()} ${chart.level.toString().padStart(2, "0")}</div>`));

        let effector = $(`<div class="effector"><span>${chart.effector}</span></div>`);

        chart_dom.append(effector);

        //https://stackoverflow.com/questions/34883555
        effector.on('mouseenter', _ => {
            let textWidth = effector[0].lastChild.clientWidth;
            let boxWidth = parseFloat(getComputedStyle(effector[0]).width);
            let translateVal = Math.min(boxWidth - textWidth, 0);
            let translateTime = -0.01 * translateVal + "s";
            effector[0].lastChild.style.transitionDuration = translateTime;
            effector[0].lastChild.style.transform = `translateX(${translateVal}px)`;
        })

        effector.on("mouseleave", _ => {
            effector[0].lastChild.style.transitionDuration = "0.3s";
            effector[0].lastChild.style.transform = "translateX(0)";
        })



        charts.append(chart_dom);
    }


    data.append(charts);

    song_dom.append(data);

    return song_dom;
}

//todo: optimisations
//e.g.: store results from a query for 'a' and query them clientside if the user then types 'ab' since we already have a superset of those results

search_box.addEventListener("input", e => {
    if(Date.now() - last_modified < wait_time_ms) clearTimeout(last_timeout);
    if(!e.target.value) return;

    last_timeout = setTimeout(autocomplete, wait_time_ms, e.target.value);
    last_modified = Date.now();
});

function autocomplete(string)
{
    fetch("/api/charts?query=" + string)
    .then(res => res.json())
    .then(json => {
        display_songs(json);
    })
}

function charts_to_songs(charts)
{
    let songs = [];
    let data_temp = {};

    for(let chart of charts)
    {
        //group charts into songs by song title + artist because we don't actually have 'songs' in our database but we want them here
        //hopefully there are no collisions > _ >
        var key = chart.title + "-" + chart.artist;
        if(!(key in data_temp)) data_temp[key] = [];

        data_temp[key].push(chart);
    }

    for(let key in data_temp)
    {
        let song = {
            title: data_temp[key][0].title,
            artist: data_temp[key][0].artist,
            charts: data_temp[key]
        }

        songs.push(song)
    }

    return songs;
}

function display_songs(charts)
{
    let songs = charts_to_songs(charts);
    let result_container = $(`#result-container`);

    result_container.empty();

    if(songs.length == 0) result_container.append(no_results);
    else
    {
        for(let song of songs)
        {
            let col = $(`<div class="col-6"></div>`);
            col.append(create_song_dom(song));
            result_container.append(col);
        }
    }
}

function show_scores(chart, scores)
{
    for(let score of scores) scores_body.append(create_record_row(score));

    //remember to change #scores-jacket if/when that becomes possible
    $("#scores-info").empty();
    $("#scores-info").append($(`
        <span>Title:<br>${chart.title}</span>
        <span>Artist:<br>${chart.artist}</span>
        <span>Effector:<br>${chart.effector}</span>
        <span>Level:<br>${diff_names[chart.difficulty].toUpperCase()} ${chart.level.toString().padStart(2, "0")}</span>
    `))

    $("#scores-container").removeClass("hidden");
    $("#charts-container").addClass("hidden");
}

function load_leaderboard(hash)
{
    let chart = chart_hash_to_chart[hash];

    let scores = fetch(`/api/charts/${hash}/scores`)
    .then(res => res.json())
    .then(json => {
        show_scores(chart, json);
    });
}

function back_to_charts()
{
    scores_body.empty();

    $("#scores-container").addClass("hidden");
    $("#charts-container").removeClass("hidden");
}
