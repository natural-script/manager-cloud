const fs = require('fs');
const path = require('path');
const express = require('express');
const staticGzip = require('http-static-gzip-regexp');
const cors = require('cors');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const bodyParser = require('body-parser');
const getFileSize = require('remote-file-size');
const app = express();
const device = require('express-device');
const Octokat = require('octokat');
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
const octo = new Octokat({token: fs.readFileSync('GITHUB_TOKEN').toString().trim()})
const root = path.join(__dirname, 'assets');

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
var repo = octo.repos('project-jste', 'framework')
repo.contents('src/JS/Translations/commands.rive').fetch() // Use `.read` to get the raw file.
.then((info) => {
var newContent = Buffer.from(info.content, 'base64').toString() + '\n\n' + req.body.command;
var config = {
  message: 'More translations for the commands',
  content: Buffer.from(newContent).toString('base64'),
  sha: info.sha,
}
repo.contents('src/JS/Translations/commands.rive').add(config)
.then((info) => {
  console.log('File Updated. new sha is ', info.commit.sha)
})
});
});

app.post('/autoCorrect', function (req, res) {
translate(req.body.input, {from: req.body.lang, to: req.body.lang}).then(res => {
    res.send(res.text);
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
