let scores_body = $("#score-body");
let diff_names = ["nov", "adv", "exh", "mxm"];

function load_token()
{
    fetch("/api/token")
    .then(res => res.json())
    .then(json => {
        $("#token").val(json.token);
    })
}

function add_score(score, chart_hashmap)
{
    var row = $(`<tr></tr>`);

    var chart = chart_hashmap[score.chartHash];
    if(!chart)
    {
        row.append($(`<td><a href="/leaderboards/chart?hash=${score.chartHash}">${score.chartHash}</a></td>`)); //just display hash because we have no idea lol
        row.append($(`<td>??? ??</td>`)); //no idea about level either
    }
    else
    {
        row.append($(`<td><a href="/leaderboards/chart?hash=${score.chartHash}">${chart.title}</a></td>`)); //todo: link to chart leaderboard page on click
        row.append($(`<td>${diff_names[chart.difficulty].toUpperCase()} ${chart.level.toString().padStart(2, "0")}</td>`));
    }


    row.append($(`<td>${score.score.score.toString().padStart(8, "0")}</td>`)); //score
    row.append($(`<td><img height="48" src="/img/grades/${get_grade(score.score.score)}.png"></td>`)); //grade
    row.append($(`<td><img height="48" src="/img/lamps/${get_lamp(score.score.lamp)}.png"></td>`)); //lamp
    row.append($(`<td>${score.score.crit}</td>`)) //crit
    row.append($(`<td>${score.score.near}</td>`));
    row.append($(`<td>${score.score.error}</td>`));

    $("#score-body").append(row);
}

function add_scores(json)
{
    let chart_hashmap = {};

    for(let chart of json.charts) chart_hashmap[chart.chartHash] = chart;

    for(let score of json.scores) add_score(score, chart_hashmap);
}

$("#view-token-modal").on("hide.bs.modal", _ => {
    $("#token").val("");
})

$(document).ready(_ => {
    fetch("/api/players/" + profile_of + "/scores?embed_charts=1")
    .then(res => res.json())
    .then(json => add_scores(json));
})
