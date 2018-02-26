// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use("/setup", express.static(__dirname + '/public'));


// http://expressjs.com/en/starter/basic-routing.html
app.get("/setup", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/setup/count", function (request, response) {
  console.log('GET recieved ' + numleds);
  response.send(numleds);
});

// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/setup/count", function (request, response) {
  //dreams.push(request.query.dream);
  numleds = reqest.query.trynumleds;
  console.log('server: POST received ' + reqest.query.trynumleds);
  console.log('server: set numleds ' + numleds);
  response.sendStatus(200);
});

//app.locals.d3 = require('d3');


// Simple in-memory store for now
var numleds = 32;
//var dreams = [
//  "Find and count some sheep",
//  "Climb a really tall mountain",
//  "Wash the dishes"
//];

// listen for requests :)
var listener = app.listen(3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

