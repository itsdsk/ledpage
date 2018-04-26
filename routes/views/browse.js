var keystone = require('keystone');
var async = require('async');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Init locals
	locals.section = 'disks';
	locals.filters = {
		channel: req.params.channel,
	};
	locals.data = {
		sketches: [],
		channels: [],
	};

	// Load all channels
	view.on('init', function (next) {

		keystone.list('SketchChannel').model.find().sort('name').exec(function (err, results) {

			if (err || !results.length) {
				return next(err);
			}

			locals.data.channels = results;

			// Load the counts for each channel
			async.each(locals.data.channels, function (channel, next) {

				keystone.list('Sketch').model.count().where('channels').in([channel.id]).exec(function (err, count) {
					channel.sketchCount = count;
					next(err);
				});

			}, function (err) {
				next(err);
			});
		});
	});

	// Load the current channel filter
	view.on('init', function (next) {

		if (req.params.channel) {
			keystone.list('SketchChannel').model.findOne({
				key: locals.filters.channel
			}).exec(function (err, result) {
				locals.data.channel = result;
				next(err);
			});
		} else {
			next();
		}
	});

	// Load the sketches
	view.on('init', function (next) {

		var q = keystone.list('Sketch').paginate({
				page: req.query.page || 1,
				perPage: 10,
				maxPages: 10,
				filters: {
					state: 'published',
				},
			})
			.sort('-publishedDate')
			.populate('author channels');

		if (locals.data.channel) {
			q.where('channels').in([locals.data.channel]);
		}

		q.exec(function (err, results) {
			locals.data.sketches = results;
			next(err);
		});
	});

	// // subscribe to channel on ipfs
	// view.on('get', {
	// 	sub: 'true'
	// }, function(next){
	// 	//
	// 	var SketchChannel = keystone.list('SketchChannel');
	// 	var newChannel = new SketchChannel.model();
	// 	var newUpdater = newChannel.getUpdateHandler(req);
	// 	var data = {
	// 		name: req.query.channel
	// 	};
	// 	newUpdater.process(data, {
	// 		flashErrors: true
	// 	}, function(err) {
	// 		if(err){
	// 			req.flash('error', 'error subscribing to channel!');
	// 			return res.redirect('/browse');
	// 		}else{
	// 			req.flash('success', 'subscribed to channel!');
	// 			return res.redirect('/browse');
	// 		}
	// 	});
	// });

	// Render the view
	view.render('browse');
};