const fs = require('fs');
const path = require('path');
const express = require('express');
const staticGzip = require('http-static-gzip-regexp');
const cors = require('cors');
const bodyParser = require('body-parser');
const getFileSize = require('remote-file-size');
const cors_proxy = require('cors-anywhere');
const app = express();
app.use(cors());
app.use(bodyParser({
  limit: '50mb'
}));
const root = path.join(__dirname, 'assets');

  app.use(staticGzip(/(framework\.min\.html)$/));

  app.use(express.static(root));

  var server = app.listen(8080);

  app.post('/getFileSize', function (req, res) {
    getFileSize(req.body.fileURL, function (err, o) {
      res.send(String(o));
    });
  });

  var localAddress = '0.0.0.0' || 'localhost';
  cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: [],
    setHeaders: {
      "Access-Control-Expose-Headers": "Content-Length"
    },
    removeHeaders: ['cookie', 'cookie2']
  }).listen(6060, localAddress, function () {});