var keystone = require('keystone');
var async = require('async');


exports = module.exports = function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;
    locals.section = 'upload';
    view.render('upload', {
        section: 'upload',
    });
};