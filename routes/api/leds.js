var fs = require('fs');
var path = require('path');

/**
 * Set media player LED coord mapping
 */
exports.map_positions = function (req, res) {
    // get new led map from HTTP post body
    const newLeds = JSON.parse(req.body.leds);
    console.log('rescale: '+JSON.parse(req.body.rescale));
    // duplicate new led map into hyperion format
    const newConfig = Array();
    for (var i = 0; i < newLeds.leds.length; i++) {
        var ledAreaOffset = 0.66 * newLeds.leds[i].r;
        var newConf = {
            index: i,
            hscan: {
                minimum: parseFloat((newLeds.leds[i].x - ledAreaOffset).toFixed(4)),
                maximum: parseFloat((newLeds.leds[i].x + ledAreaOffset).toFixed(4))
            },
            vscan: {
                minimum: parseFloat((newLeds.leds[i].y - ledAreaOffset).toFixed(4)),
                maximum: parseFloat((newLeds.leds[i].y + ledAreaOffset).toFixed(4))
            }
        };
        newConfig.push(newConf);
    }
    // create config directory if doesnt exist
    if (!fs.existsSync(res.locals.configStaticPath)) {
        console.log('creating config directory');
        fs.mkdirSync(res.locals.configStaticPath);
    }
    // read hyperion config template then add new led coords and save
    var cfgTemplatePath = path.join(__dirname, '/../../libs/controller/hyperion_segments/hyperion.template.json');
    console.log(cfgTemplatePath);
    fs.readFile(cfgTemplatePath, function (err, data) {
        if (err) {
            console.log('could not read hyperion config: ' + err);
            return res.apiError({
                success: false,
                note: 'update for LED mapping failed because the config template is missing'
            });
        }
        try {
            // save new hyperion config
            const ledConfig = JSON.parse(data);
            ledConfig.leds = newConfig;
            var jsonLedConfig = JSON.stringify(ledConfig, null, '\t');
            fs.writeFile(res.locals.configStaticPath + 'hyperion.config.json', jsonLedConfig, 'utf8', (fserr) => {
                if (fserr) {
                    console.log(fserr);
                    res.apiError({
                        success: false,
                        note: 'LED mapping file could not be saved'
                    });
                } else {
                    // save new leds.json
                    const jsonNewLeds = JSON.stringify(newLeds, null, 2);
                    fs.writeFile(res.locals.configStaticPath + 'leds.json', jsonNewLeds, 'utf8', (fserr) => {
                        if (fserr) {
                            console.log(fserr);
                            res.apiError({
                                success: false,
                                note: 'the LED mapping could not be saved',
                                error: fserr
                            });
                        } else {
                            console.log('LED mapping files saved');
                        }
                    });
                }
            });
            // restart hyperion
            var sys = require('sys');
            var exec = require('child_process').exec;
            var execCommand = 'systemctl restart hyperion.service';
            exec(execCommand, function (err, stdout, stderr) {
                console.log(stdout);
                if (err) {
                    return res.apiError({
                        success: false,
                        note: 'saved new LED mapping but interface could not be restarted'
                    });
                } else {
                    return res.apiResponse({
                        success: true,
                        note: 'saved new LED mapping and restarted interface',
                        reload: true
                    });
                }
            });
        } catch (exception) {
            console.log('error updating LED mapping: ' + exception);
            return res.apiError({
                success: false,
                note: 'unknown error updating LED mapping'
            });
        }
    });
};

/**
 * Calibrate colour order and values
 */
exports.calibrate = function (req, res) {
    // get hyperion config
    var hyperionConfigPath = path.join(res.locals.configStaticPath, '/hyperion.config.json');
    var hyperionConfExists = fs.existsSync(hyperionConfigPath);
    if (hyperionConfExists) {
        var hyperionConfig = fs.readFileSync(hyperionConfigPath);
        if (!hyperionConfig) {
            return res.apiError({
                success: false,
                note: 'colours not calibrated because config file was not found'
            });
        } else {
            var hyperionConfigJSON = JSON.parse(hyperionConfig);
            // save settings
            var calibVals = req.body; // shorthand
            hyperionConfigJSON.device.colorOrder = calibVals.colOrder;
            var hyperionChannels = hyperionConfigJSON.color.channelAdjustment[0];
            hyperionChannels.pureRed.redChannel = parseInt(calibVals.redR);
            hyperionChannels.pureRed.greenChannel = parseInt(calibVals.redG);
            hyperionChannels.pureRed.blueChannel = parseInt(calibVals.redB);
            hyperionChannels.pureGreen.redChannel = parseInt(calibVals.greenR);
            hyperionChannels.pureGreen.greenChannel = parseInt(calibVals.greenG);
            hyperionChannels.pureGreen.blueChannel = parseInt(calibVals.greenB);
            hyperionChannels.pureBlue.redChannel = parseInt(calibVals.blueR);
            hyperionChannels.pureBlue.greenChannel = parseInt(calibVals.blueG);
            hyperionChannels.pureBlue.blueChannel = parseInt(calibVals.blueB);
            // write new hyperion config
            fs.writeFileSync(hyperionConfigPath, JSON.stringify(hyperionConfigJSON, null, 2));
            // update profile in database
            require('keystone').list('Profile').model.find().exec(function (err, results) {

                if (err || !results.length) {
                    return res.apiError({
                        success: false,
                        note: 'colours calibrated but not updated in database (profile not found)'
                    });
                }
                // shorthand for profile and new settings
                var profile = results[0];
                // set new settings in database
                profile.colOrder = calibVals.colOrder;
                profile.redR = calibVals.redR;
                profile.redG = calibVals.redG;
                profile.redB = calibVals.redB;
                profile.greenR = calibVals.greenR;
                profile.greenG = calibVals.greenG;
                profile.greenB = calibVals.greenB;
                profile.blueR = calibVals.blueR;
                profile.blueG = calibVals.blueG;
                profile.blueB = calibVals.blueB;
                // save new settings to database
                profile.save(function (err) {
                    if (err) {
                        return res.apiError({
                            success: false,
                            note: 'colours calibrated but could not update profile in database'
                        });
                    } else {
                        // restart hyperion
                        var sys = require('sys');
                        var exec = require('child_process').exec;
                        var execCommand = 'systemctl restart hyperion.service';
                        exec(execCommand, function (err, stdout, stderr) {
                            console.log(stdout);
                            if (err) {
                                return res.apiError({
                                    success: false,
                                    note: 'colours calibrated but the LED interface could not be restarted'
                                });
                            } else {
                                return res.apiResponse({
                                    success: true,
                                    note: 'saved and updated LED colour calibration',
                                    reload: true
                                });
                            }
                        });
                    }
                });
            });
        }
    }
};


/**
 * Setup LED output configuration
 */
exports.config_arduino = function (req, res) {
    // get request body from HTTP post
    var config = {
        "ledcount": parseInt(req.body.numLeds, 10),
        "chipset": req.body.ledChip,
        "platform": req.body.boardType,
        "datapin": req.body.dataPin
    };
    if (req.body.clockPin) {
        config.clockpin = req.body.clockPin;
    }
    // create config directory if doesnt exist
    if (!fs.existsSync(res.locals.configStaticPath)) {
        console.log('creating config directory');
        fs.mkdirSync(res.locals.configStaticPath);
    }
    // write config file
    fs.writeFile(res.locals.configStaticPath + 'setup.json', JSON.stringify(config, null, 4), 'utf8', function (err) {
        if (err) {
            console.log('error saving setup json' + err);
            return res.apiError({
                success: false,
                note: 'hardware update failed because the config couldnt be written to storage'
            });
        } else {
            console.log('saved setup config json');
        }
    });
    // check if arduino is installed
    var commandExists = require('command-exists');
    commandExists('arduino', function (err, commandExists) {
        if (!commandExists) {
            console.log('arduino not available');
            return res.apiError({
                success: false,
                note: 'hardware update failed because arduino is not installed'
            });
        } else {
            // construct arduino file
            fs.writeFile("./libs/controller/arduino_segments/form_setup.ino", '#include "FastLED.h"\n', function (err) {
                if (err) {
                    console.log('error starting arduino file');
                    console.log(err);
                    return res.apiError({
                        success: false,
                        note: 'hardware update failed because the arduino file could not be written'
                    });
                }
                var define1 = '#define DATA_PIN ' + req.body.dataPin + '\n';
                var define3 = '#define NUM_LEDS ' + req.body.numLeds + '\n';
                var define4 = '#define COLOR_ORDER RGB' + '\n';
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
                        return res.apiError({
                            success: false,
                            note: 'hardware update failed, the arduino file could not be added to'
                        });
                    }
                    fs.readFile("./libs/controller/arduino_segments/template.txt", (err, contents) => {
                        if (err) {
                            console.log('error reading template arduino file');
                            console.log(err);
                            return res.apiError({
                                success: false,
                                note: 'hardware update failed, the arduino template file could not be read'
                            });
                        }
                        fs.appendFile("./libs/controller/arduino_segments/form_setup.ino", contents, function (err) {
                            if (err) {
                                console.log('error adding arduino template to file');
                                console.log(err);
                                return res.apiError({
                                    success: false,
                                    note: 'hardware update failed, error building arduino file'
                                });
                            }
                            console.log('created arduino file');
                            // compile and upload new arduino file
                            const exec = require('child_process').exec;
                            console.log('starting arduino compile & upload');
                            var syncArduino = exec('./libs/controller/arduino_segments/compileupload.sh', (err, stdout, stderr) => {
                                console.log('out: ' + `${stdout}`);
                                console.log('errors:' + `${stderr}`);
                                if (err !== null) {
                                    console.log(`exec error: ${err}`);
                                    return res.apiError({
                                        success: false,
                                        note: 'hardware update failed, could not sync arduino'
                                    });
                                } // ref: https://stackoverflow.com/a/44667294
                                if (!err) {
                                    return res.apiResponse({
                                        success: true,
                                        note: 'settings for arduino compiled and uploaded',
                                        redirect: '/'
                                    });
                                } else {
                                    return res.apiError({
                                        success: false,
                                        note: 'hardware update failed, could not compile and upload to arduino'
                                    });
                                }
                            });
                        });
                    });
                });
            });
        }
    });
};

const net = require('net');
/**
 * Set hyperion brightness
 */
exports.set_brightness = function (req, res) {
    var val = parseFloat(req.params.val);
    var jsonCommand = {
        command: "transform",
        transform: {
            luminanceGain: val
        }
    };
    var client = new net.Socket();
    client.setTimeout(1500);
    client.connect(19444, 'localhost', function () {
        console.log('Connected');
        const string = JSON.stringify(jsonCommand) + "\n";
        client.write(string);
    });
    client.on('error', (error) => {
        console.log('error setting brightness');
        console.log(error);
        return res.apiError({
            success: false,
            note: 'brightness not set'
        });
    });
    client.on('data', function (data) {
        console.log('Received: ' + data);
        client.destroy(); // kill client after server's response
        return res.apiResponse({
            success: true,
            note: 'set brightness'
        });
    });
};


/**
 * Reboot device
 */
exports.reboot = function (req, res) {
    // check resin supervisor exists
    const exec = require('child_process').exec;
    var checkSupervisor = exec('printenv RESIN_SUPERVISOR_API_KEY', (err, stdout, stderr) => {
        console.log('out: ' + `${stdout}`);
        console.log('errors:' + `${stderr}`);
        if (err !== null) {
            console.log(`exec error: ${err}`);
            return res.apiError({
                success: false,
                note: 'reboot failed because the supervisor key is not present'
            });
        }
        if (stdout.length > 0) { // exists
            // command for resin supervisor reboot
            var cmd = 'curl -X POST --header "Content-Type:application/json" "$RESIN_SUPERVISOR_ADDRESS/v1/reboot?apikey=$RESIN_SUPERVISOR_API_KEY"';
            // send reboot signal
            var reboot = exec(cmd, (err, stdout, stderr) => {
                console.log('out: ' + `${stdout}`);
                console.log('errors:' + `${stderr}`);
                if (err !== null) {
                    console.log(`exec error: ${err}`);
                    return res.apiError({
                        success: false,
                        note: 'reboot failed, the reboot signal could not be sent'
                    });
                }
                if (!err) {
                    return res.apiResponse({
                        success: true,
                        note: 'system rebooting',
                        redirect: '/'
                    });
                } else {
                    return res.apiError({
                        success: false,
                        note: 'reboot failed, the supervisor signal was not sent'
                    });
                }
            });
        } else { // supervisor doesnt exist
            return res.apiError({
                success: false,
                note: 'reboot failed, the supervisor key is not available'
            });
        }
    });
};

/**
 * Shutdown device
 */
exports.shutdown = function (req, res) {
    // check resin supervisor exists
    const exec = require('child_process').exec;
    var checkSupervisor = exec('printenv RESIN_SUPERVISOR_API_KEY', (err, stdout, stderr) => {
        console.log('out: ' + `${stdout}`);
        console.log('errors:' + `${stderr}`);
        if (err !== null) {
            console.log(`exec error: ${err}`);
            return res.apiError({
                success: false,
                note: 'shutdown failed, the supervisor key is not present'
            });
        }
        if (stdout.length > 0) { // exists
            // command for resin supervisor shutdown
            var cmd = 'curl -X POST --header "Content-Type:application/json" "$RESIN_SUPERVISOR_ADDRESS/v1/shutdown?apikey=$RESIN_SUPERVISOR_API_KEY"';
            // send shutdown signal
            const exec = require('child_process').exec;
            var reboot = exec(cmd, (err, stdout, stderr) => {
                console.log('out: ' + `${stdout}`);
                console.log('errors:' + `${stderr}`);
                if (err !== null) {
                    console.log(`exec error: ${err}`);
                    return res.apiError({
                        success: false,
                        note: 'shutdown failed, the signal could not be sent'
                    });
                }
                if (!err) {
                    return res.apiResponse({
                        success: true,
                        note: 'shutdown initiated',
                        redirect: '/'
                    });
                } else {
                    return res.apiError({
                        success: false,
                        note: 'shutdown signal could not be sent'
                    });
                }
            });
        } else { // supervisor doesnt exist
            return res.apiError({
                success: false,
                note: 'shutdown failed, could not talk to supervisor'
            });
        }
    });
};