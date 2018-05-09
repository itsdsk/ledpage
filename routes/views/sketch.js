var keystone = require('keystone');
const ipc = require('node-ipc');
var fs = require('fs');
var path = require('path');

exports = module.exports = function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;
	// Set locals
	locals.section = 'browse';
	locals.filters = {
		id: req.params.id,
	};
	locals.data = {
		sketches: [],
		channels: [],
	};
	locals.validationErrors = {};
	locals.formData = req.body || {};
	// Load the current sketch
	view.on('init', function (next) {
		var q = keystone.list('Media').model.findOne({
			state: 'published',
			_id: locals.filters.id,
			// slug: locals.filters.sketch,
		}).populate('author channels');
		q.exec(function (err, result) {
			locals.data.sketch = result;
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
	// Loads sketch screenshots
	view.on('init', function (next) {
		// 
		var sketchPath = res.locals.staticPath + locals.data.sketch.localDir;
		// make path absolute
		var resolvedPath = path.resolve(__dirname + './../../', sketchPath);
		var targetFiles;
		fs.readdir(resolvedPath, function (err, files) {
			if (err) {
				console.log('error getting files: ' + err);
			}
			targetFiles = files.filter(function (file) {
				return path.extname(file).toLowerCase() === '.png';
			});
			locals.data.thumbnails = targetFiles;
			next(err);
		});
	});
	// Load other sketches
	view.on('init', function (next) {
		var q = keystone.list('Media').model.find().where('state', 'published').sort('-publishedDate').populate('author').limit('4');
		q.exec(function (err, results) {
			locals.data.sketches = results;
			next(err);
		});
	});
	// Render the view
	view.render('sketch');
};