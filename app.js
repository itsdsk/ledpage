const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const Handlebars = require('handlebars');
const fs = require('fs');

var template;
fs.readFile(__dirname + "/template.handlebars", function (err, data) {
  if (err) throw err;
  template = Handlebars.compile(data.toString());
});

var data = [{
  "name": "t1",
  "desc": "d1"
}, {
  "name": "t11",
  "desc": "d11"
}, {
  "name": "t111",
  "desc": "d111"
}];

app.use('/', express.static('./'));

app.ws('/', function (ws, req) {
  ws.on('message', function (msg) {
    data.forEach(element => {
      var result = template(element);
      ws.send(result);
    });
    console.log(msg);
  });
});

app.listen(3000);