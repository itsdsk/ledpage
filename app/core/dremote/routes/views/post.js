var keystone = require('keystone');
const ipc = require('node-ipc');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.section = 'blog';
	locals.filters = {
		post: req.params.post,
	};
	locals.data = {
		posts: [],
	};

	// Load the current post
	view.on('init', function (next) {

		var q = keystone.list('Post').model.findOne({
			state: 'published',
			slug: locals.filters.post,
		}).populate('author categories');

		q.exec(function (err, result) {
			locals.data.post = result;
			next(err);
		});

	});

	// Load other posts
	view.on('init', function (next) {

		var q = keystone.list('Post').model.find().where('state', 'published').sort('-publishedDate').populate('author').limit('4');

		q.exec(function (err, results) {
			locals.data.posts = results;
			next(err);
		});

	});

	// Forward instruction to display selected sketch
	view.on('get', { display: 'on' }, function(next) {

		var sketchPath = locals.data.post.localPath;

		ipc.config.id = 'dremoteipc'; 
		ipc.config.retry = 1500; 
		 
		ipc.connectTo( 
			'dplayeripc', 
			function(){ 
				ipc.of.dplayeripc.on( 
					'connect', 
					function(){ 
						//ipc.log('## connected to world ##'.rainbow, ipc.config.delay); 
						ipc.of.dplayeripc.emit( 
							'message',  //any event or message type your server listens for 
							sketchPath
						);
						ipc.disconnect('dplayeripc');
					} 
				); 
				ipc.of.dplayeripc.on( 
					'disconnect', 
					function(){ 
						ipc.log('disconnected from world'.notice); 
					} 
				); 
				ipc.of.dplayeripc.on( 
					'message',  //any event or message type your server listens for 
					function(data){ 
						ipc.log('got a message from world : '.debug, data); 
					} 
				); 
			} 
		);		

		next();
	});

	// Render the view
	view.render('post');
};
