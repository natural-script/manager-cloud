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
const translate = require('google-translate-api');
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
const connectionString = process.env.DATABASE_URL;
const client = new pg.Client(connectionString);
client.connect();

app.use(staticGzip(/(framework-LiveVersion\.min\.html|db-manager\.min\.html|loader\.min\.js)$/));

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
  client.query('INSERT INTO commands(command) VALUES($1)', [req.body.command]);
  res.send('Thanks for helping in shaping Jste :)')
});

app.post('/autoCorrect', function (req, res) {
  translate(req.body.input, {
    from: req.body.lang,
    to: req.body.lang
  }).then(result => {
    res.send(result.text);
  });
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