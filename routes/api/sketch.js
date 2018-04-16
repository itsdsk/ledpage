//var async = require('async'),
var keystone = require('keystone');

// http
var http = require('http');

// fs
var fs = require('fs');
var path = require('path');

var Sketch = keystone.list('Sketch');

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
	// get api route
	var addPath = '/api/' + data + '/add';
	// call add api
	http.get({
		host: 'localhost',
		path: addPath
	}, function (response) {
		// Continuously update stream with data
		var body = '';
		response.on('data', function (d) {
			body += d;
		});
		response.on('end', function () {

			// Data reception is done, do whatever with it!
			var parsed = JSON.parse(body);
			console.log('added');
			console.log(parsed);
		});
	});
};
var ipfsInitAttempts = 0;
var ipfsInit = () => {
	ipfs.id(function (err, identity) {
		if (err) {
			console.log('ipfs init error');
			//console.log(err);
			ipfsInitAttempts += 1;
			if (ipfsInitAttempts < 3) {
				setTimeout(function () {
					ipfsInit();
				}, 15000);
			}
		} else {
			keystone.list('SketchChannel').model.find().sort('name').exec(function (err, channels) {

				if (err || !channels.length) {
					console.log('error: no channels');
				}

				channels.forEach((channel) => {
					//console.log('adding channel:')
					var topic = channel.name;
					//console.log(topic);
					ipfs.pubsub.subscribe(topic, channelMsg, (suberr) => {
						if (suberr) {
							console.log('Could not subscribe..');
							console.log(suberr);
							throw suberr;
						}
					});
				});
			});
			ipfs.pubsub.ls((err, topics) => {
				if (err) {
					console.log('ipfs pubsub ls err');
					//console.log(err);
					throw err;
				}
				//console.log("Subscribed topics:");
				//console.log(topics);
			});

		}
	});
};

ipfsInit();

// Periodically show peers
setInterval(function () {
	//console.log('syncing with ipfs');
	// share sketches on ipfs
	ipfs.id(function (err, identity) {
		if (err) {
			if (ipfsInitAttempts < 3) {
				console.log('connection error trying to sync with ipfs');
				//console.log(err);
			}
		} else {
			// find channels
			keystone.list('SketchChannel').model.find().sort('name').exec(function (err, channels) {

				if (err || !channels.length) {
					console.log('error finding sketch categories to sync with ipfs');
				}
				// loop through channels
				channels.forEach((channel) => {
					console.log('adding channel:');
					var ipfsTopic = channel.name;
					console.log(ipfsTopic);
					// loop through sketches
					keystone.list('Sketch').model.find().where('channels').in([channel.id]).exec(function (err, sketchesToShare) {
						if (err) console.log(err);
						sketchesToShare.forEach((sketchToShare) => {
							if (sketchToShare.ipfsHash) {
								console.log('trying to share');
								console.log(sketchToShare.ipfsHash);
								console.log('in topic');
								console.log(channel.name);
								ipfs.pubsub.publish(channel.name, new Buffer(sketchToShare.ipfsHash), (err) => {
									if (err) {
										console.log('error trying to publish sketch');
										console.log(err);
										throw err;
									}
								});
							}
						});
					});

				});
			});
		}
	});


	// // periodically show peers
	// ipfs.pubsub.ls((err, topics) => {
	// 	if (err) {
	// 		console.log('ipfs pubsub ls err:');
	// 		console.log(err);
	// 		throw err;
	// 	}
	// 	console.log("Subscribed topics:");
	// 	console.log(topics);
	// 	topics.forEach((topic) => {
	// 		ipfs.pubsub.peers(topic, (err, peerIds) => {
	// 			if (err) {
	// 				throw err;
	// 			}
	// 			console.log("Peers:");
	// 			console.log(peerIds);
	// 		});

	// 	})
	// });

	// ipfs.pubsub.publish(topic, new Buffer('banana'), () => {})
}, 900000); // 15 min timer


// ipc connection
const ipc = require('node-ipc');
var isDplayerConnected = false;
ipc.config.id = 'dremoteipc';
ipc.config.retry = 5000;
ipc.config.maxRetries = 3;
ipc.config.silent = true;
ipc.connectTo(
	'dplayeripc',
	function () {
		ipc.of.dplayeripc.on(
			'connect',
			function () {
				isDplayerConnected = true;
			}
		);
	});

const hyperion = new(require('hyperion-js-api'))("localhost", 19444);
const net = require('net');
/**
 * Set hyperion brightness
 */
exports.setBrightness = function (req, res) {

	var val = parseFloat(req.params.val);

	var jsonCommand = {
		command: "transform",
		transform: {
			luminanceGain: val
		}
	};

	var client = new net.Socket();
	client.setTimeout(1500);
	client.connect(19444, 'localhost', function () {
		console.log('Connected');
		const string = JSON.stringify(jsonCommand) + "\n";
		client.write(string);
	});

	client.on('error', (error) => {
		console.log('error setting brightness');
		console.log(error);
		return res.apiResponse({
			error: error
		});
	});

	client.on('data', function (data) {
		console.log('Received: ' + data);
		client.destroy(); // kill client after server's response
		res.apiResponse({
			success: true,
			response: data
		});
	});

	// hyperion.getOn((error, response) => {
	// 	if (error) {
	// 		console.log('error setting hyperion brightness - no connection?');
	// 		console.log(error);
	// 		return res.apiResponse({
	// 			error: error
	// 		})
	// 	}

	// 	const col = hyperion.color.rgb(val, val, val);
	// 	hyperion.setBrightness(col.value(), (error, response) => {
	// 		if (error) {
	// 			console.log('error setting hyperion brightness - no connection?');
	// 			console.log(error);
	// 			return res.apiResponse({
	// 				error: error
	// 			})
	// 		}
	// 		res.apiResponse({
	// 			success: true,
	// 			response: response
	// 		})
	// 	})
	// })
};
/**
 * Get hyperion brightness
 */
exports.getBrightness = function (req, res) {
	hyperion.getOn((error, response) => {
		if (error) {
			console.log('error getting hyperion brightness - no connection?');
			console.log(error);
			return res.apiError({
				error: error
			});
		}
		hyperion.getBrightness((error, response) => {
			if (error) {
				console.log('error getting hyperion brightness - no connection?');
				console.log(error);
				return res.apiError({
					error: error
				});
			}
			console.log('success getting hyperion brightness');
			console.log(response);
			res.apiResponse({
				success: true,
				response: response
			});
		});
	});
};


/**
 * List IPFS id
 */
exports.ipfs = function (req, res) {

	ipfs.id(function (err, identity) {
		if (err) {
			console.log('ipfs error (no connection?)');
			//console.log(err);
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

exports.getSketch = function (req, res) {
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
				console.log(err);
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
	if (!isDplayerConnected) {
		console.log('play error: player not connected');

		return res.apiError({
			success: false
		});

	}
	Sketch.model.findById(req.params.id).exec(function (err, item) {

		if (err) return res.apiError('database error', err);
		if (!item) return res.apiError('not found');

		if (ipc.of.dplayeripc) {
			var sketchPath = 'file:///' + res.locals.staticPath + item.localDir + '/index.html';
			ipc.of.dplayeripc.emit('message', sketchPath);
			console.log('yes');

			res.apiResponse({
				success: true
			});
		} else {
			console.log('neswsfo');

			res.apiError({
				success: false
			});

		}

	});
};

/**
 * Get sketch player status
 */

exports.player = function (req, res) {
	if (!isDplayerConnected) {
		console.log('player error: player not connected');

		return res.apiError({
			success: false
		});

	} else {
		console.log('player is connected');

		return res.apiResponse({
			success: true
		});
	}
};

/**
 * Set sketch player LED coord mapping
 */
exports.mapleds = function (req, res) {
	// get new led map from HTTP post body
	const newLeds = JSON.parse(req.body.leds);
	// duplicate new led map into hyperion format
	const newConfig = Array();
	for (var i=0; i<newLeds.leds.length; i++){
		var newConf = {index: i,
			hscan: {mininum: newLeds.leds[i].x, maximum: (newLeds.leds[i].x+0.1111)},
			vscan: {mininum: newLeds.leds[i].y, maximum: (newLeds.leds[i].y+0.1111)}
		};
		newConfig.push(newConf);
	}
	// read hyperion config template then add new led coords and save
	fs.readFile('./libs/controller/hyperion_segments/hyperion.template.json', function(err, data){
		if(err) {
			console.log('wefaf'+err);
			return res.apiError({
				success: false
			});	
		}
		try{
			// save new hyperion config
			const ledConfig = JSON.parse(data);
			ledConfig.leds = newConfig;
			const jsonLedConfig = JSON.stringify(ledConfig, null, 2);
			fs.writeFile(res.locals.configStaticPath +'hyperion.config.json', jsonLedConfig, 'utf8', (fserr) => {
				if (fserr) {
					console.log(fserr);
					res.apiResponse({
						success: false,
						note: 'Error saving file...',
						error: fserr
					});
				}else{
					// save new leds.json
					const jsonNewLeds = JSON.stringify(newLeds, null, 2);
					fs.writeFile(res.locals.configStaticPath + 'leds.json', jsonNewLeds, 'utf8', (fserr) => {
						if (fserr) {
							console.log(fserr);
							res.apiResponse({
								success: false,
								note: 'Error saving file...',
								error: fserr
							});
						}else{
							console.log('File saved');
						}
					});
					console.log('File saved');
				}
			});
			return res.apiResponse({
				success: true
			});
		}catch(exception){
			console.log('wedwddfaf'+exception);
			return res.apiError({
				success: false
			});	
		}
	});
	// console.log(ledConfig);
	// if (!isDplayerConnected) {
	// 	console.log('no');

	// 	return res.apiError({
	// 		success: false
	// 	});

	// } else {
	// 	console.log('yes');

	// 	return res.apiResponse({
	// 		success: true
	// 	});
	// }
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
				console.log('ipfs file add error');
				//console.log(ipfserr);
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
		});
	});
};