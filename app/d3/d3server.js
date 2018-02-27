// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

const fileUpload = require('express-fileupload');

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// default upload (https://www.npmjs.com/package/express-fileupload)
app.use(fileUpload());
app.post('/setup/upload', function(req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');
 
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;
 
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('/usr/src/app/d3/public/sampleFile.json', function(err) {
    if (err)
      return res.status(500).send(err);
 
    res.send('File uploaded!');
  });
});

// http://expressjs.com/en/starter/static-files.html
app.use("/setup", express.static(__dirname + '/public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/setup", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

//app.get("/setup/count", function (request, response) {
//  console.log('server: GET recieved ' + numleds);
  //response.sendStatus(200);
  //response.send(numleds);
//});

// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
//app.post("/setup/count", function (request, response) {
  //dreams.push(request.query.dream);
//  numleds = request.query.trynumleds;
//  console.log('server: POST received ' + request.query.trynumleds);
//  console.log('server: set numleds ' + numleds);
//  response.sendStatus(200);
//});

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

