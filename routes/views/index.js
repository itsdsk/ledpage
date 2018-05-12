var keystone = require('keystone');
var async = require('async');
var Media = keystone.list('Media');
var MediaChannel = keystone.list('MediaChannel');

exports = module.exports = function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;
	// Init locals
	locals.section = 'index';
	locals.filters = {
		channel: req.params.channel,
	};
	locals.data = {
		media: [],
		channels: [],
	};
	// Load all channels
	view.on('init', function (next) {
		MediaChannel.model.find().sort('name').exec(function (err, results) {
			if (err || !results.length) {
				return next(err);
			}
			locals.data.channels = results;
			// Load the counts for each channel
			async.each(locals.data.channels, function (channel, next) {
				Media.model.count().where('channels').in([channel.id]).exec(function (err, count) {
					channel.mediaCount = count;
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
			MediaChannel.model.findOne({
				key: locals.filters.channel
			}).exec(function (err, result) {
				locals.data.channel = result;
				next(err);
			});
		} else {
			next();
		}
	});
	// Load media
	view.on('init', function (next) {
		var paginateOpts = {
			page: req.query.page || 1,
			perPage: 15,
			maxPages: 10,
			filters: {
				state: 'published',
			}
		};
		// filter channel
		if(locals.data.channel){
			paginateOpts.filters.channels = locals.data.channel;
		}
		var q = Media.paginate(paginateOpts)
			.sort('-publishedDate')
			.populate('channels');
		q.exec(function (err, results) {
			locals.data.media = results;
			next(err);
		});
	});
	// Render the view
	view.render('index');
};