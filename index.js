const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const pg = require('pg');
const staticGzip = require('http-static-gzip-regexp');
const cors = require('cors');
const https = require('https');
const bodyParser = require('body-parser');
const getFileSize = require('remote-file-size');
const app = express();
const device = require('express-device');
const favicon = require('serve-favicon');
app.use(device.capture());
app.use(cors());
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));
app.use(bodyParser.json({
    limit: '50mb',
    type: 'application/json'
}));
app.use(favicon(path.join(__dirname, 'assets', 'favicon.ico')));
const root = path.join(__dirname, 'assets');
if (process.env.DATABASE_URL) {
    const pgConnectionString = process.env.DATABASE_URL;
    global.client = new pg.Client(pgConnectionString);
    client.connect();
} else if (process.env.MYSQLCONNSTR_localdb) {
    const mysqlConnectionString = process.env.MYSQLCONNSTR_localdb;
}

app.use(staticGzip(/(naturalScript\.min\.js|db-manager\.min\.html|loader\.min\.js|loader-CodePenVersion\.min\.js)$/));

app.use(express.static(root));

app.listen(process.env.PORT || 3000);

app.post('/getFileSize', function(req, res) {
    getFileSize(req.body.fileURL, function(err, o) {
        res.send(String(o));
    });
});

app.get('/deviceForm', function(req, res) {
    res.send(req.device.type);
});

app.get('/getBuildInfo', function(req, res) {
    res.sendFile(path.join(__dirname, 'buildInfo.json'))
});

app.post('/submitCommand', function(req, res) {
    if (req.body.type == 'command') {
        client.query('INSERT INTO commands(contributer, email, command) VALUES($1, $2, $3)', [req.body.contributer, req.body.email, req.body.command]);
    } else if (req.body.type == 'dictionary') {
        client.query('INSERT INTO dictionary(contributer, email, db) VALUES($1, $2, $3)', [req.body.contributer, req.body.email, req.body.DB]);
    }
    res.send('Thanks for helping in shaping Jste :)')
});

app.post('/autoCorrect', function(req, res) {
    let key = process.env.BING_SPELL_CHECK_KEY;
    let request_params = {
        method: 'POST',
        hostname: 'api.cognitive.microsoft.com',
        path: `/bing/v7.0/spellcheck?mkt=${req.body.lang}&mode=spell`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': req.body.input.length + 5,
            'Ocp-Apim-Subscription-Key': key
        }
    };

    let response_handler = function(response) {
        let body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var corrections = JSON.parse(body).flaggedTokens;
            var result = req.body.input;
            for (var i = 0; i < corrections.length; i++) {
                var result = result.replace(corrections[i].token, corrections[i].suggestions[0].suggestion);
            }
            res.send(result)
        });
        response.on('error', function(e) {
            res.send('Error: ' + e.message);
        });
    };

    let reqCorrections = https.request(request_params, response_handler);
    reqCorrections.write("text=" + req.body.input);
    reqCorrections.end();
});

app.post('/getVideoInfo', function(req, res) {
    https.get(`https://jste-video-dl.herokuapp.com/api/info?url=${req.body.url}`, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            res.send(JSON.parse(data));
        });

    }).on("error", (err) => {
        res.send("Error: " + err.message);
    });
});