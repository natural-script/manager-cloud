const fs = require('fs');
const path = require('path');
const express = require('express');
const pg = require('pg');
const staticGzip = require('http-static-gzip-regexp');
const cors = require('cors');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
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
  const client = new pg.Client(pgConnectionString);
  client.connect();
} else if (process.env.MYSQLCONNSTR_localdb) {
  const mysqlConnectionString = process.env.MYSQLCONNSTR_localdb;
}

app.use(staticGzip(/(framework-LiveVersion\.min\.html|db-manager\.min\.html|loader\.min\.js|loader-CodePenVersion\.min\.js)$/));

app.use(express.static(root));

app.listen(process.env.PORT || 3000);

app.post('/getFileSize', function (req, res) {
  getFileSize(req.body.fileURL, function (err, o) {
    res.send(String(o));
  });
});

app.get('/deviceForm', function (req, res) {
  res.send(req.device.type);
});

app.post('/submitCommand', function (req, res) {
  if (res.body.type == 'command') {
    client.query('INSERT INTO commands(command) VALUES($1)', [req.body.command]);
  } else if (res.body.type == 'wordsDB') {
    client.query('INSERT INTO wordsDB(DB) VALUES($1)', [req.body.DB]);
  }
  res.send('Thanks for helping in shaping Jste :)')
});

app.post('/autoCorrect', function (req, res) {
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

  let response_handler = function (response) {
    let body = '';
    response.on('data', function (d) {
      body += d;
    });
    response.on('end', function () {
      var corrections = JSON.parse(body).flaggedTokens;
      var result = req.body.input;
      for (var i = 0; i < corrections.length; i++) {
        var result = result.replace(corrections[i].token, corrections[i].suggestions[0].suggestion);
      }
      res.send(result)
    });
    response.on('error', function (e) {
      res.send('Error: ' + e.message);
    });
  };

  let reqCorrections = https.request(request_params, response_handler);
  reqCorrections.write("text=" + req.body.input);
  reqCorrections.end();
});

app.post('/getVideoInfo', function (req, res) {
  var request = new XMLHttpRequest();
  request.open('POST', 'https://loadercdn.io/api/v1/create');

  request.setRequestHeader('Content-Type', 'application/json');

  request.onreadystatechange = function () {
    if (this.readyState === 4) {
      res.send(this.responseText);
    }
  };

  var body = {
    'key': 'EatRoyUhJZVyhfI2V4dUNuwiDrTooY6T7fG5bQw',
    'link': req.body.url
  };

  request.send(JSON.stringify(body));
});