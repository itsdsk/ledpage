var keystone = require('keystone');

exports = module.exports = function (req, res) {

    var view = new keystone.View(req, res);
    var locals = res.locals;

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'display';

    locals.boardTypes = [{
        value: "uno",
        label: "Arduino Uno"
    }];
    locals.dataPins = [{
        value: "5",
        label: "5"
    }];
    locals.ledChips = [{
        value: "WS2812B",
        label: "WS2812B (also Neopixel)"
    }];
    locals.ledOrders = [{
            value: "RGB",
            label: "RGB"
        },
        {
            value: "BGR",
            label: "BGR"
        },
        {
            value: "BRG",
            label: "BRG"
        },
        {
            value: "GRB",
            label: "GRB"
        }
    ];

    locals.formData = req.body || {};
    locals.validationErrors = {};
    locals.setupSubmitted = false;

    view.on('post', {
        action: 'setup'
    }, function (next) {

        var fs = require('fs');
        //var stream = fs.createWriteStream("hodho.json")

        // construct arduino file
        fs.writeFile("./libs/arduino_segments/form-setup.ino", '#include "FastLED.h"\n', function (err) {
            if(err) {
                console.log('error starting arduino file');
                console.log(err);
                return next();
            }
            var define1 = '#define DATA_PIN ' + req.body.dataPin + '\n';
            var define2 = '#define NUM_LEDS ' + req.body.numLeds + '\n';
            var define3 = '#define COLOR_ORDER ' + req.body.ledOrder + '\n';
            var define4 = '#define LED_TYPE ' + req.body.ledChip + '\n';
            var defines = define1.concat(define2, define3, define4);
            fs.appendFile("./libs/arduino_segments/form-setup.ino", defines, function(err) {
                if(err) {
                    console.log('error adding defines to arduino file');
                    console.log(err);
                    return next();
                }
                fs.readFile("./libs/arduino_segments/display.txt", (err, contents) => {
                    if(err) {
                        console.log('error reading template arduino file');
                        console.log(err);
                        return next();    
                    }
                    fs.appendFile("./libs/arduino_segments/form-setup.ino", contents, function(err) {
                        if(err) {
                            console.log('error adding arduino template to file');
                            console.log(err);
                            return next();        
                        }
                        console.log('finished creating arduino file!');
                    })
                })
            });
        });

        // compile and upload new arduino file
        const exec = require('child_process').exec;
        console.log('starting arduino compile & upload');
        var syncArduino = exec('./libs/arduino_segments/compileupload.sh', (err, stdout, stderr) => {
            console.log(`${stdout}`);
            console.log(`${stderr}`);
            if(err !== null) {
                console.log(`exec error: ${error}`);
            } // ref: https://stackoverflow.com/a/44667294
        });

        // var config = {
        //     "ledcount": parseInt(req.body.numLeds, 10),
        //     "chipset": req.body.ledChip,
        //     "order": req.body.ledOrder,
        //     "platform": req.body.boardType,
        //     "datapin": req.body.dataPin
        // };
        // fs.writeFile("./libs/setup.json", JSON.stringify(config, null, 4), 'utf8', function (err) {
        //     if(err) {
        //         console.log('error saving setup json');
        //         console.log(err);
        //         return next();
        //     }
        //     console.log('saved!');
        // })
        //console.log(req.body);
        locals.setupSubmitted = true;
        next();
    });

    // Render the view
    view.render('setup', {
        section: 'display',
    });
};