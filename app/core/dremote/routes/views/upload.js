var keystone = require('keystone');
var async = require('async');

var Sketch = keystone.list('Sketch');
var fs = require('fs');
var path = require('path');

exports = module.exports = function (req, res) {

    var view = new keystone.View(req, res);
    var locals = res.locals;

    locals.section = 'upload';
    locals.formData = req.body || {};
    locals.validationErrors = {};
    locals.sketchSubmitted = false;

    view.on('post', {
        action: 'upload'
    }, function (next) {

        var application = new Sketch.model();
        console.log('made new sketch id:');
        console.log(application.id);
        var updater = application.getUpdateHandler(req);


        // make folder
        var uploadPath = "/data/sketches/view-static/" + application.id;
        try {
            fs.mkdirSync(uploadPath);
        } catch (fserr) {
            if (fserr.code !== 'EEXIST') {
                throw fserr;
            }
        }
        // save file
        var uploadName = uploadPath + "/index.html";
        fs.writeFile(uploadName, req.body.sketch, 'utf8', (err) => {
            if (err) console.log(err)
            //else console.log('File saved')
        });

        var data = {
            title: application.id,
            localPath: uploadPath
        };

        updater.process(data, {
            flashErrors: true
        }, function (err) {
            if (err) {
                locals.validationErrors = err.errors;
            } else {
                locals.sketchSubmitted = true;
            }
            next();
        });

    });

    view.render('upload', {
        section: 'upload',
    });

}