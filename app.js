const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const helper = require("./media.js");

// get items
var media = helper.scanMedia();

// serve index.html
app.use('/', express.static('./'));

// load
app.ws('/', function (ws, req) {
  ws.on('message', function (msg) {
    media.forEach(element => {
      ws.send(helper.mediaObjectToHtml(element));
    });
    console.log(msg);
  });
});

app.listen(3000, () => console.log("listening on 3000"));