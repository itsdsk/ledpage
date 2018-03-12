 var async = require('async'),
 	keystone = require('keystone');

 // ipfs connection
 var ipfsAPI = require('ipfs-api');
 var ipfs = ipfsAPI('localhost', '5001', {
 	protocol: 'http'
 });
 console.log('routes api sketch');

 // ipc connection
 const ipc = require('node-ipc');
 ipc.config.id = 'dremoteipc';
 ipc.config.retry = 1500;
 ipc.connectTo(
 	'dplayeripc',
 	function () {
 		ipc.of.dplayeripc.on(
 			'connect',
 			function () {
 				console.log("IPC connected");
 			}
 		)
 	});


 var Sketch = keystone.list('Sketch');


 /**
  * List IPFS id
  */
 exports.ipfs = function (req, res) {

 	ipfs.id(function (err, identity) {
 		if (err) {
 			console.log(err)
 			return res.apiError('ipfs error', err);
 		} else {
 			console.log("Identity:")
 			console.log(identity)
 			res.apiResponse({
 				id: identity
 			});

 		}
 	})
 }

 /**
  * Get Sketch by ID
  */

 exports.get = function (req, res) {
 	Sketch.model.findById(req.params.id).exec(function (err, item) {

 		if (err) return res.apiError('database error', err);
 		if (!item) return res.apiError('not found');

 		res.apiResponse({
 			sketch: item
 		});

 	});
 }


 /**
  * List Sketches
  */
 exports.list = function (req, res) {
 	Sketch.model.find(function (err, items) {

 		if (err) return res.apiError('database error', err);

 		res.apiResponse({
 			sketches: items
 		});

 	});
 }

 /**
  * Play Sketch by ID
  */

 exports.play = function (req, res) {
 	Sketch.model.findById(req.params.id).exec(function (err, item) {

 		if (err) return res.apiError('database error', err);
 		if (!item) return res.apiError('not found');

 		var sketchPath = 'file:///' + item.localPath + 'index.html';
 		ipc.of.dplayeripc.emit('message', sketchPath);


 		res.apiResponse({
 			success: true
 		});

 	});
 }


 /**
  * Sync Sketch to IPFS
  */

 exports.sync = function (req, res) {
 	Sketch.model.findById(req.params.id).exec(function (err, item) {

 		if (err) return res.apiError('database error', err);
 		if (!item) return res.apiError('not found');

 		var sketchPath = ["/data/sketches/view-static/sketch1"];//item.localPath;

 		ipfs.files.add(sketchPath, {recursive: true}, function (ipfserr, files) {
 			if (ipfserr) {
 				console.log(ipfserr)
 				return res.apiError('ipfs error', ipfserr);
 			} else {
 				console.log("Added:")
 				files.forEach((file) => {
 					console.log(file.path);
 					console.log(file.hash);
 					console.log(file.size);
 				});
 				res.apiResponse({
 					files: files
 				});

 			}
 		})
 	});
 }


 // /**
 //  * Get Post by ID
 //  */
 // exports.get = function(req, res) {
 // 	Post.model.findById(req.params.id).exec(function(err, item) {

 // 		if (err) return res.apiError('database error', err);
 // 		if (!item) return res.apiError('not found');

 // 		res.apiResponse({
 // 			post: item
 // 		});

 // 	});
 // }


 // /**
 //  * Create a Post
 //  */
 // exports.create = function(req, res) {

 // 	var item = new Post.model(),
 // 		data = (req.method == 'POST') ? req.body : req.query;

 // 	item.getUpdateHandler(req).process(data, function(err) {

 // 		if (err) return res.apiError('error', err);

 // 		res.apiResponse({
 // 			post: item
 // 		});

 // 	});
 // }

 // /**
 //  * Get Post by ID
 //  */
 // exports.update = function(req, res) {
 // 	Post.model.findById(req.params.id).exec(function(err, item) {

 // 		if (err) return res.apiError('database error', err);
 // 		if (!item) return res.apiError('not found');

 // 		var data = (req.method == 'POST') ? req.body : req.query;

 // 		item.getUpdateHandler(req).process(data, function(err) {

 // 			if (err) return res.apiError('create error', err);

 // 			res.apiResponse({
 // 				post: item
 // 			});

 // 		});

 // 	});
 // }

 // /**
 //  * Delete Post by ID
 //  */
 // exports.remove = function(req, res) {
 // 	Post.model.findById(req.params.id).exec(function (err, item) {

 // 		if (err) return res.apiError('database error', err);
 // 		if (!item) return res.apiError('not found');

 // 		item.remove(function (err) {
 // 			if (err) return res.apiError('database error', err);

 // 			return res.apiResponse({
 // 				success: true
 // 			});
 // 		});

 // 	});
 // }