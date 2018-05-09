var keystone = require('keystone');

exports = module.exports = function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;
    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'setup';
    locals.boardTypes = [{
        value: "uno",
        label: "Arduino Uno"
    }, {
        value: "leonardo",
        label: "Arduino Leonardo"
    }, {
        value: "mega",
        label: "Arduino Mega (ATmega1280)"
    }, {
        value: "mega2560",
        label: "Arduino Mega 2560 or Mega ADK"
    }, {
        value: "nano328",
        label: "Arduino Nano w/ ATmega328"
    }, {
        value: "nano",
        label: "Arduino Nano w/ ATmega168"
    }];
    locals.dataPins = [{
        value: "13",
        label: "13"
    }, {
        value: "12",
        label: "12"
    }, {
        value: "11",
        label: "11"
    }, {
        value: "10",
        label: "10"
    }, {
        value: "9",
        label: "9"
    }, {
        value: "8",
        label: "8"
    }, {
        value: "7",
        label: "7"
    }, {
        value: "6",
        label: "6"
    }, {
        value: "5",
        label: "5"
    }, {
        value: "4",
        label: "4"
    }];
    locals.clockPins = [{
        value: "13",
        label: "13"
    }, {
        value: "12",
        label: "12"
    }, {
        value: "11",
        label: "11"
    }, {
        value: "10",
        label: "10"
    }, {
        value: "9",
        label: "9"
    }, {
        value: "8",
        label: "8"
    }, {
        value: "7",
        label: "7"
    }, {
        value: "6",
        label: "6"
    }, {
        value: "5",
        label: "5"
    }, {
        value: "4",
        label: "4"
    }];
    locals.ledChips = [{
            value: "APA102",
            label: "APA102 (also Dotstar)",
            pins: "4pin"
        },
        {
            value: "WS2812B",
            label: "WS2812B (also Neopixel)",
            pins: "3pin"
        },
        {
            value: "WS2813",
            label: "WS2813",
            pins: "3pin"
        },
        {
            value: "WS2812",
            label: "WS2812",
            pins: "3pin"
        },
        {
            value: "WS2811",
            label: "WS2811",
            pins: "3pin"
        },
        {
            value: "WS2801",
            label: "WS2801",
            pins: "4pin"
        },
        {
            value: "TM1812",
            label: "TM1812",
            pins: "3pin"
        },
        {
            value: "TM1809",
            label: "TM1809",
            pins: "3pin"
        },
        {
            value: "TM1804",
            label: "TM1804",
            pins: "3pin"
        },
        {
            value: "TM1803",
            label: "TM1803",
            pins: "3pin"
        },
        {
            value: "UCS2903",
            label: "UCS2903",
            pins: "3pin"
        },
        {
            value: "UCS1903",
            label: "UCS1903",
            pins: "3pin"
        },
        {
            value: "LPD8806",
            label: "LPD8806",
            pins: "4pin"
        },
        {
            value: "SM16716",
            label: "SM16716",
            pins: "4pin"
        },
        {
            value: "P9813",
            label: "P9813",
            pins: "4pin"
        },
        {
            value: "GW6205",
            label: "GW6205",
            pins: "3pin"
        },
        {
            value: "APA104",
            label: "APA104",
            pins: "3pin"
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
    // load profile
    view.on('init', function (next) {
        keystone.list('Profile').model.find().exec(function (err, results) {
            if (err || !results.length) {
                console.log('errore getting profile');
            }
            locals.profile = results[0];
            next(err);
        });
    });
    // Render the view
    view.render('setup', {
        section: 'setup',
    });
};