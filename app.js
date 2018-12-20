const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// get items
var media = new Array();
fs.readdirSync('./media').filter(function (file) {
  if (fs.statSync('./media/' + file).isDirectory()) {
    var med = require('./media/' + file + '/demo.json');
    media.push(med);
  }
});

// item template
var template;
fs.readFile(__dirname + "/template.handlebars", function (err, data) {
  if (err) throw err;
  template = Handlebars.compile(data.toString());
});

app.use('/', express.static('./'));

app.ws('/', function (ws, req) {
  ws.on('message', function (msg) {
    media.forEach(element => {
      fs.readFile('./media/item1/thumb.jpg', function (err, buf) {
        if (err) throw err;
        var img = "data:image/jpeg;base64," + buf.toString('base64');
        element.img_src = img;
        var result = template(element);
        ws.send(result);
      });
      console.log(element);
    });
    console.log(msg);
  });
});

app.listen(3000);