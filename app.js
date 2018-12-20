const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const helper = require("./media.js");

const Dat = require('dat-node');

// get items
var media = helper.scanMedia();

// serve index.html
app.use('/', express.static('./'));

// load
app.ws('/', function (ws, req) {
  ws.on('message', function (msg) {
    media.forEach(element => {
      console.log(element);
      ws.send(helper.mediaObjectToHtml(element));
    });
    console.log(msg);
  });
});

app.listen(3000, () => console.log("listening on 3000"));

Dat('./media/item1', function (err, dat) {
  if (err) throw err;
  dat.importFiles();
  dat.joinNetwork();
  console.log("dat link: dat://"+dat.key.toString('hex'));
});