var keystone = require('keystone');
const ipc = require('node-ipc');
var fs = require('fs');
var path = require('path');

exports = module.exports = function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;
	// Set locals
	locals.section = 'media';
	locals.filters = {
		id: req.params.id,
	};
	locals.data = {
		channels: [],
	};
	// Load the current media item
	view.on('init', function (next) {
		var q = keystone.list('Media').model.findOne({
			state: 'published',
			_id: locals.filters.id,
		}).populate('channels');
		q.exec(function (err, result) {
			locals.data.media = result;
			next(err);
		});
	});
	// Load all channels
	view.on('init', function (next) {
		keystone.list('MediaChannel').model.find().sort('name').exec(function (err, results) {

			if (err || !results.length) {
				return next(err);
			}
			locals.data.channels = results;
			next(err);
		});
	});
	// Render the view
	view.render('media');
};