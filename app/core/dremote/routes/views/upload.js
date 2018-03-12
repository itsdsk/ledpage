var keystone = require('keystone');
var async = require('async');

exports = module.exports = function (req, res) {

    var view = new keystone.View(req, res);
    var locals = res.locals;

    locals.section = 'upload';
    locals.formData = req.body || {};
    locals.validationErrors = {};
    locals.sketchSubmitted = false;

    // view.on('post', { action: 'upload' }, function (next) {

    // 	var application = new Enquiry.model();
    // 	var updater = application.getUpdateHandler(req);

    // 	updater.process(req.body, {
    // 		flashErrors: true
    // 	}, function (err) {
    // 		if (err) {
    // 			locals.validationErrors = err.errors;
    // 		} else {
    // 			locals.enquirySubmitted = true;
    // 		}
    // 		next();
    // 	});

    // });

    view.render('upload', {
        section: 'upload',
    });

}