const fs = require('fs');
const path = require('path');
const express = require('express');
const staticGzip = require('http-static-gzip-regexp');
const cors = require('cors');
const bodyParser = require('body-parser');
const getFileSize = require('remote-file-size');
const app = express();
app.use(cors());
app.use(bodyParser({
  limit: '50mb'
}));
const root = path.join(__dirname, 'assets');

  app.use(staticGzip(/(framework\.min\.html|db-manager\.min\.html)$/));

  app.use(express.static(root));

  app.listen(process.env.PORT || 3000);

  app.post('/getFileSize', function (req, res) {
    getFileSize(req.body.fileURL, function (err, o) {
      res.send(String(o));
    });
  });