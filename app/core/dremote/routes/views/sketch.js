var keystone = require('keystone');
const ipc = require('node-ipc');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.section = 'browse';
	locals.filters = {
		sketch: req.params.sketch,
	};
	locals.data = {
		sketches: [],
	};

	// Load the current sketch
	view.on('init', function (next) {

		var q = keystone.list('Sketch').model.findOne({
			state: 'published',
			slug: locals.filters.sketch,
		}).populate('author categories');

		q.exec(function (err, result) {
			locals.data.sketch = result;
			next(err);
		});

	});

	// Load other sketches
	view.on('init', function (next) {

		var q = keystone.list('Sketch').model.find().where('state', 'published').sort('-publishedDate').populate('author').limit('4');

		q.exec(function (err, results) {
			locals.data.sketches = results;
			next(err);
		});

	});

	// Forward instruction to display selected sketch
	view.on('get', {
		display: 'on'
	}, function (next) {

		var sketchPath = locals.data.sketch.localPath;
		ipc.of.dplayeripc.emit('message', sketchPath);
		req.flash('success', 'Sketch queued for display.')
		return next();
	});

	// update ipns
	view.on('get', {
		update: 'ipns'
	}, function (next) {

		var fs = require('fs');
		var sketchPath = locals.data.sketch.localPath;
		var sketchHash = locals.data.sketch.ipnsHash;
		console.log(sketchHash);
		locals.ipfs.files.get(sketchHash, function (err, files) {
			if (err) {
				console.log(err)
			} else {
				files.forEach((file) => {
					console.log(file.path);
					//var filePath = sketchPath
					//fs.writeFile()
				});
			}
		});

		// var addr = '/ipns/QmZXWHxvnAPdX1PEc7dZHTSoycksUE7guLAih8z3b43UmU'
		// locals.ipfs.name.resolve(addr, function(err, name) {
		// 	if (err) {
		// 		console.log(err);
		// 	} else {
		// 		console.log('Resolved name:');
		// 		console.log(name);
		// 	}
		// });
		req.flash('success', 'Handled.');
		return next();
	});

	// Render the view
	view.render('sketch');
};