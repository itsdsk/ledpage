// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

var d3 = require("d3");
var fs = require("fs");
const fileUpload = require('express-fileupload');
// run shell script 
var sys = require('sys');
var exec = require('child_process').exec;

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// default upload (https://www.npmjs.com/package/express-fileupload)
app.use(fileUpload());
app.post('/setup/upload', function (req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(__dirname + "/public/sampleFile.json", function (err) {
    if (err)
      return res.status(500).send(err);

    // load the data
    var jsonleds = [];
    d3.json("http://localhost:3000/setup/sampleFile.json", function (data) {
      function countNumLeds() {
        jsonleds = data;
        if (data.length != numleds) {
          console.log("recompiling arduino: " + data.length + " != " + numleds);
          numleds = data.length;
          exec('/usr/src/app/core/dsetup/arduino_files/makearduino.sh ' + numleds,
            function (error, stdout, stderr) {
              if (error !== null) {
                console.log(error);
              } else {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
              }
            });
        } else {
          console.log('arduino ready');
        }
      }
      countNumLeds();
      JSONCoordsToConfig();
      function JSONCoordsToConfig() {
        var jsonconfig = [];
        //var minFloat = 0.0;
        //var maxFloat = 1.0;
        for (var i = 0; i < jsonleds.length; i++) {
          // get coord
          var coord = jsonleds[i];
          var dHscan = { "minimum": coord.x, "maximum": coord.x + 0.1111 };
          var dVscan = { "minimum": coord.y, "maximum": coord.y + 0.1111 };
          //
          jsonconfig.push({ "index": i, "hscan": dHscan, "vscan": dVscan });
        }
        // write leds to file
        fs.writeFile('/usr/src/app/core/dsetup/hyperion_config/leds.txt', JSON.stringify(jsonconfig, null, '\t'), function (err) {
          if (err) throw err;
        });
        // run script to append files to create full config
        exec('/usr/src/app/core/dsetup/hyperion_config/makehyperionconfig.sh',
          function (error, stdout, stderr) {
            if (error !== null) {
              console.log(error);
            } else {
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
            }
          });
      }
    });
    res.redirect('/setup');
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

var numleds = 32;

// listen for requests :)
var listener = app.listen(3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

