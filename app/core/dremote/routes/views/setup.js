var keystone = require('keystone');

exports = module.exports = function (req, res) {

    var view = new keystone.View(req, res);
    var locals = res.locals;

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'display';

    locals.boardTypes = [{
        value: "arduinouno",
        label: "Arduino Uno"
    }];
    locals.dataPins = [{
        value: "A1",
        label: "A1"
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
        locals.setupSubmitted = true;
        next();
    });

    // Render the view
    view.render('setup', {
        section: 'display',
    });
};