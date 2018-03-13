 //var async = require('async'),
 var keystone = require('keystone');



 // ipfs connection
 var ipfsAPI = require('ipfs-api');
 var ipfs = ipfsAPI('localhost', '5001', {
 	protocol: 'http'
 });
 const channelMsg = (msg) => {
	console.log('Channel msg received...');
 	console.log(msg);
 	data = msg.data.toString('utf8');
 	console.log("Received data: '" + data + "'");
 };
 var topic = 'resin-ipfs';

 var ipfsInit = () => {
 	ipfs.id(function (err, identity) {
 		if (err) {
 			console.log(err);
 			setTimeout(function () {
 				ipfsInit();
 			}, 5000);
 		} else {
 			console.log("Identity:");
 			console.log(identity);
 			ipfs.pubsub.subscribe(topic, channelMsg, (err) => {
 				console.log('Could not subscribe..');
 				console.log(err);
 			});

 			// keystone.list('SketchChannel').model.find().sort('name').exec(function (err, channels) {

 			// 	if (err || !channels.length) {
 			// 		console.log('error: no channels')
 			// 	}

 			// 	channels.forEach((channel) => {
 			// 		console.log('adding channel:')
 			// 		console.log(channel.name);
 			// 		var topic = 'resin-ipfs'
 			// 		ipfs.pubsub.subscribe(topic, channelMsg, (suberr) => {
 			// 			console.log('Could not subscribe..')
 			// 			console.log(suberr);
 			// 		})
 			// 	})
 			// })
 			ipfs.pubsub.ls((err, topics) => {
 				if (err) {
 					console.log('ipfs pubsub ls err:');
 					console.log(err);
 					throw err;
 				}
 				console.log("Subscribed topics:");
 				console.log(topics);
 			});

 		}
 	});
 };

 ipfsInit()

 // Periodically show peers
 setInterval(function () {
	ipfs.pubsub.publish(topic, new Buffer('banana'), () => {})
 	// ipfs.pubsub.peers(topic, (err, peerIds) => {
 	// 	if (err) {
 	// 		throw err;
 	// 	}
 	// 	console.log("Peers:");
 	// 	console.log(peerIds);
 	// });
 	// ipfs.pubsub.ls((err, topics) => {
 	// 	if (err) {
 	// 		console.log('ipfs pubsub ls err:');
 	// 		console.log(err);
 	// 		throw err;
 	// 	}
 	// 	console.log("Subscribed topics:");
 	// 	console.log(topics);
 	// });

 	// ipfs.pubsub.publish(topic, new Buffer('banana'), () => {})
 }, 10000);

 // fs
 var fs = require('fs');
 var path = require('path');


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
 		);
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
 			console.log("Identity:");
 			console.log(identity);
 			res.apiResponse({
 				id: identity
 			});

 		}
 	});
 };

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
 };


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
 };

 /**
  * Add Sketch from IPFS
  */
 exports.add = function (req, res) {

 	if (req.params.ipfs) {
 		// // check if hash is already in database
 		// Sketch.model.findOne({
 		// 	ipfsHash: req.params.ipfs
 		// }).exec(function (err, result) {
 		// 	// IPFS hash is already in database
 		// 	if (result) {
 		// 		res.apiResponse({
 		// 			success: false
 		// 		});
 		// 	}
 		// });
 		// // try add IPFS hash
 		// res.apiResponse({
 		// 	success: true,
 		// 	ipfsHash: req.params.ipfs
 		// });

 		// try add IPFS hash
 		var ipfsURI = '/ipfs/' + req.params.ipfs; //'/ipfs/' + ipfsHash;
 		ipfs.files.get(ipfsURI, function (err, files) {
 			if (err) {
 				//console.log('not workng')
 				console.log(err)
 				res.apiResponse({
 					success: false,
 					error: err
 				});

 			} else {

 				// check existing database
 				Sketch.model.findOne({
 					ipfsHash: req.params.ipfs
 				}).exec(function (dberr, result) {
 					if (result) {
 						res.apiResponse({
 							success: false,
 							duplicates: result
 						});

 					} else {
 						// save each file
 						var saveDir = req.params.ipfs;
 						var sketchPath = res.locals.staticPath + saveDir;
 						files.forEach((file) => {
 							if (file.content) {

 								//console.log(file.path);
 								var fileName = file.path.slice(46); // trim ipfs hash
 								var fileDir = path.dirname(fileName);
 								//var filePath = sketchPath + fileDir; // full directory
 								fileDir
 									.split(path.sep)
 									.reduce((currentPath, folder) => {
 										currentPath += folder + path.sep;
 										if (!fs.existsSync(path.join(sketchPath, currentPath))) {
 											try {
 												fs.mkdirSync(path.join(sketchPath, currentPath));
 											} catch (fserr) {
 												if (fserr.code !== 'EEXIST') {
 													throw fserr;
 												}
 											}
 										}
 										return currentPath;
 									}, '');
 								var fileURI = sketchPath + fileName;
 								//console.log(fileURI);
 								fs.writeFile(fileURI, file.content, 'binary', (fserr) => {
 									if (fserr) {
 										console.log(fserr);
 										res.apiResponse({
 											success: false,
 											note: 'Error saving file...',
 											error: fserr
 										});
 									}
 									//else console.log('File saved')
 								});
 							}
 						});
 						// add to database
 						var application = new Sketch.model();
 						var updater = application.getUpdateHandler(req);
 						var data = {
 							title: saveDir,
 							ipfsHash: req.params.ipfs,
 							localDir: saveDir
 						};
 						updater.process(data, {
 							flashErrors: true
 						}, function (upderr) {
 							if (upderr) {
 								res.apiResponse({
 									success: false,
 									note: 'Error adding new sketch to database...',
 									error: upderr
 								});
 							} else {
 								res.apiResponse({
 									success: true,
 									sketch: files
 								});

 							}
 						});


 					}
 				});

 			}
 		});

 	} else {
 		// no IPFS key added
 		res.apiResponse({
 			success: false,
 			error: "no ipfs key aded"
 		});

 	}
 };


 /**
  * Play Sketch by ID
  */

 exports.play = function (req, res) {
 	Sketch.model.findById(req.params.id).exec(function (err, item) {

 		if (err) return res.apiError('database error', err);
 		if (!item) return res.apiError('not found');

 		var sketchPath = 'file:///' + res.locals.staticPath + item.localDir + '/index.html';
 		ipc.of.dplayeripc.emit('message', sketchPath);


 		res.apiResponse({
 			success: true
 		});

 	});
 };


 /**
  * Sync Sketch to IPFS
  */

 exports.sync = function (req, res) {
 	Sketch.model.findById(req.params.id).exec(function (err, item) {

 		if (err) return res.apiError('database error', err);
 		if (!item) return res.apiError('not found');

 		//var okSketchPath = ["/data/sketches/view-static/sketch1"];
 		var sketchPath = [];
 		sketchPath.push(path.join(res.locals.staticPath, item.localDir));

 		ipfs.files.add(sketchPath, {
 			recursive: true
 		}, function (ipfserr, files) {
 			if (ipfserr) {
 				console.log(ipfserr);
 				return res.apiError('ipfs error', ipfserr);
 			} else {
 				console.log("Added:");
 				files.forEach((file) => {
 					console.log(file.path);
 					console.log(file.hash);
 					console.log(file.size);
 				});

 				var data = {
 					ipfsHash: files[files.length - 1].hash
 				};

 				Sketch.updateItem(item, data, {
 					fields: ["ipfsHash"]
 				}, function (dberror) {
 					if (dberror) console.log(dberror);

 				});

 				res.apiResponse({
 					files: files
 				});

 			}
 		})
 	});
 }