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
    locals.clockPins = [{
        value: "13",
        label: "13"
    }];
    locals.ledChips = [{
            value: "WS2812B",
            label: "WS2812B (also Neopixel)",
            pins: "3pin"
        },
        {
            value: "APA102",
            label: "APA102 (also Dotstar)",
            pins: "4pin"
        }
    ];
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

        var config = {
            "ledcount": parseInt(req.body.numLeds, 10),
            "chipset": req.body.ledChip,
            "order": req.body.ledOrder,
            "platform": req.body.boardType,
            "datapin": req.body.dataPin
        };
        if(req.body.clockPin){
            config.clockpin = req.body.clockPin;
        }
        fs.writeFile("/data/content/config-static/setup.json", JSON.stringify(config, null, 4), 'utf8', function (err) {
            if (err) {
                console.log('error saving setup json');
                console.log(err);
                return next();
            }
            console.log('saved setup.json');
        });

        if (true) {
            // construct arduino file
            fs.writeFile("./libs/controller/arduino_segments/form_setup.ino", '#include "FastLED.h"\n', function (err) {
                if (err) {
                    console.log('error starting arduino file');
                    console.log(err);
                    return next();
                }
                var define1 = '#define DATA_PIN ' + req.body.dataPin + '\n';
                var define3 = '#define NUM_LEDS ' + req.body.numLeds + '\n';
                var define4 = '#define COLOR_ORDER ' + req.body.ledOrder + '\n';
                var define5 = '#define LED_TYPE ' + req.body.ledChip + '\n';
                var defines;
                if (!req.body.clockPin) {
                    defines = define1.concat(define3, define4, define5);
                } else if (req.body.clockPin) {
                    var define2 = '#define CLOCK_PIN ' + req.body.clockPin + '\n';
                    defines = define1.concat(define2, define3, define4, define5);
                }
                fs.appendFile("./libs/controller/arduino_segments/form_setup.ino", defines, function (err) {
                    if (err) {
                        console.log('error adding defines to arduino file');
                        console.log(err);
                        return next();
                    }
                    fs.readFile("./libs/controller/arduino_segments/template.txt", (err, contents) => {
                        if (err) {
                            console.log('error reading template arduino file');
                            console.log(err);
                            return next();
                        }
                        fs.appendFile("./libs/controller/arduino_segments/form_setup.ino", contents, function (err) {
                            if (err) {
                                console.log('error adding arduino template to file');
                                console.log(err);
                                return next();
                            }
                            console.log('finished creating arduino file!');
                            // compile and upload new arduino file
                            const exec = require('child_process').exec;
                            console.log('starting arduino compile & upload');
                            var syncArduino = exec('./libs/controller/arduino_segments/compileupload.sh', (err, stdout, stderr) => {
                                console.log(`${stdout}`);
                                console.log(`${stderr}`);
                                if (err !== null) {
                                    console.log(`exec error: ${error}`);
                                } // ref: https://stackoverflow.com/a/44667294
                            });

                        });
                    });
                });
            });
        }

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