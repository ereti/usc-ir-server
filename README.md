# usc-ir-server

This server is a mostly usable example of an IR server for [unnamed-sdvx-clone](https://github.com/Drewol/unnamed-sdvx-clone).
It implements the [USC-IR specification](https://uscir.readthedocs.io/en/latest/index.html).
It also implements a web UI for registration, viewing of chart leaderboards, and viewing latest scores by a user.

## Prerequisites

This server makes use of a [MongoDB](https://www.mongodb.com/) instance, so you will need to set up, or have access to, one of those.
If you use Docker, this is very simple:

```
docker pull mongo
docker run -d -p 27017:27017 --name mongodb mongo
```

You may also wish to set up the server behind an [NginX](https://nginx.com/) reverse proxy, for HTTPS.

You will also need to install the modules used by the server. Since package.json is provided, this is as simple as running: 

```
npm install
```

## Running

The server can be ran with 

```
node index.js
```

However, I would suggest making use of a utility that can keep a Node.js program running, for instance [PM2](https://pm2.keymetrics.io/), as so:

```
npm install pm2 -g
pm2 start index.js
```

## Configuration

The config.json file included in the repository contains all of the configuration keys that are checked by the server. They are documented below.

```
https: Whether the server should assume it is using HTTPS
  When true, cookies are treated as secure, and the server will assume it is operating behind a reverse proxy.
  Default: false
hashWorkFactor: The work factor to use for hashing passwords with bcrypt. Bigger = more secure but takes longer. Default: 12
webUICookieSecret: The secret used to generate session cookies for the web UI. This should be changed, as without it your sessions are unsecure. The default does not matter. Change it.
serverPort: The port the server will listen on. Default: 8080
serverName: How the server identifies itself in IR Heartbeat requests. Also how the server identifies itself on the web UI. Default: USC-IR-Server
database: The IP to connect to the MongoDB instance on. Default: localhost
allowedUsernameCharacters: The characters to accept in newly registered usernames. Default: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*-
acceptNewCharts: When the server receives a score for a chart it has never seen before:
  true: the server will store the chart information and accept the score.
  false: the server will reject the score with statusCode 42.
  Default: true
adjacentRecordsN: The number of scores to either side of the player's PB to return in the response to score submissions. Default: 2
typicalWindows: The hit windows that will be considered 'typical' by the server. 
  Default: {perfect: 46, good: 92, hold: 138, miss: 250} (i.e, the same as the USC default hit windows)
acceptAtypicalWindows: When the server receives a score that uses windows other than typicalWindows:
  true: the server will accept the score
  false: the server will reject the score
  Default: false
```
