var async = require('async');
var keystone = require('keystone');

// http
var http = require('http');

// fs
var fs = require('fs');
var path = require('path');

var Media = keystone.list('Media');
var MediaChannel = keystone.list('MediaChannel');

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
			keystone.list('MediaChannel').model.find().sort('name').exec(function (err, channels) {

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
	// share media on ipfs
	ipfs.id(function (err, identity) {
		if (err) {
			if (ipfsInitAttempts < 3) {
				console.log('connection error trying to sync with ipfs');
				//console.log(err);
			}
		} else {
			// find channels
			keystone.list('MediaChannel').model.find().sort('name').exec(function (err, channels) {

				if (err || !channels.length) {
					console.log('error finding media categories to sync with ipfs');
				}
				// loop through channels
				channels.forEach((channel) => {
					console.log('adding channel:');
					var ipfsTopic = channel.name;
					console.log(ipfsTopic);
					// loop through media
					keystone.list('Media').model.find().where('channels').in([channel.id]).exec(function (err, sketchesToShare) {
						if (err) console.log(err);
						sketchesToShare.forEach((sketchToShare) => {
							if (sketchToShare.ipfsHash) {
								console.log('trying to share');
								console.log(sketchToShare.ipfsHash);
								console.log('in topic');
								console.log(channel.name);
								ipfs.pubsub.publish(channel.name, new Buffer(sketchToShare.ipfsHash), (err) => {
									if (err) {
										console.log('error trying to publish media');
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

/**
 * Get Media by ID
 */

exports.get = function (req, res) {
	Media.model.findById(req.params.id).exec(function (err, item) {

		if (err) return res.apiError('database error', err);
		if (!item) return res.apiError('not found');

		res.apiResponse({
			sketch: item
		});

	});
};


/**
 * List Media
 */
exports.list = function (req, res) {
	Media.model.find(function (err, sketchList) {

		if (err) {
			return res.apiError({
				success: false,
				note: 'could not get media from database'
			});
		}

		// list channels
		MediaChannel.model.find(function(err, channelList) {

			if (err) {
				return res.apiError({
					success: false,
					note: 'could not get channels from database'
				});
			}
			res.apiResponse({
				success: true,
				note: 'retrieved media list from database',
				sketches: sketchList,
				channels: channelList,
			});	
		});
	});
};


/**
 * Play Media by ID
 */

exports.play = function (req, res) {
	if (!isDplayerConnected) {
		console.log('play error: player not connected');

		return res.apiError({
			success: false,
			note: 'renderer not active'
		});

	}
	Media.model.findById(req.params.id).exec(function (err, item) {

		if (err) {
			return res.apiError({
				success: false,
				note: 'could not find media in database'
			});
		}
		if (!item) {
			return res.apiError({
				success: false,
				note: 'could not get media from database'
			});
		}

		if (ipc.of.dplayeripc) {
			var sketchPath = 'file:///' + res.locals.staticPath + item.localDir + '/index.html';
			ipc.of.dplayeripc.emit('message', sketchPath);
			console.log('yes');

			res.apiResponse({
				success: true,
				note: 'queued media to display'
			});
		} else {
			console.log('neswsfo');

			res.apiError({
				success: false,
				note: 'failed to queue media to display'
			});

		}

	});
};


/**
 * Create new Sketch
 */

exports.create = function (req, res) {
	var newModel = new Media.model();
	var updater = newModel.getUpdateHandler(req);

	// make folder
	var saveDir = newModel.id;
	var uploadPath = res.locals.viewStaticPath + saveDir;
	try {
		fs.mkdirSync(uploadPath);
	} catch (err) {
		if(fserr.code !== 'EEXIST') {
			return res.apiError({
				success: false,
				note: 'could not create new directory for media'
			});
		}
	}
	// save file
	var uploadName = uploadPath + '/index.html';
	fs.writeFile(uploadName, req.body.sketch, 'utf8', (err) => {
		if(err) {
			return res.apiError({
				success: false,
				note: 'could not save HTML to storage'
			});
		}
	});
	// update database
	var data = {
		title: saveDir,
		localDir: saveDir
	};
	updater.process(data, {
		flashErrors: true
	}, function (err) {
		if(err) {
			return res.apiError({
				success: false,
				note: 'could not save to database'
			});
		}else{
			return res.apiResponse({
				success: true,
				note: 'uploaded new media'
			});
		}
	});
};

/**
 * Update Sketch by ID
 */

exports.update = function (req, res) {
	Media.model.findById(req.params.id).exec(function (err, item) {

		if (err) {
			return res.apiError({
				success: false,
				note: 'database error'+ err
			});
		}
		if (!item) {
			return res.apiError({
				success: false,
				note: 'sketch ID not found'
			});
		}

		// get absolute file name
		var saveName = res.locals.staticPath + item.localDir + '/index.html';
		// get code from HTTP body
		var code = req.body.code;
		// save sketch
		fs.writeFile(saveName, code, 'utf8', function (err) {
			if (err) {
				// error saving
				// req.flash('warning', 'error saving html');
				// return res.redirect('/media/'+locals.data.sketch.slug);
				return res.apiError({
					success: false,
					note: 'error saving sketch file'
				})
			} else {
				// success saving
				// req.flash('success', 'success saving html');
				// return res.redirect('/media/'+locals.data.sketch.slug);
				// save title
				item.title = req.body.title;
				item.save(function (err) {
					if (err) {
						return res.apiError({
							success: false,
							note: 'could not update database ' + err
						});
					} else {
						res.apiResponse({
							success: true,
							note: 'sketch updated'
						});
					}
				});

			}
		});

		// if (ipc.of.dplayeripc) {
		// 	var sketchPath = 'file:///' + res.locals.staticPath + item.localDir + '/index.html';
		// 	ipc.of.dplayeripc.emit('message', sketchPath);
		// 	console.log('yes');

		// 	res.apiResponse({
		// 		success: true
		// 	});
		// } else {
		// 	console.log('neswsfo');

		// 	res.apiError({
		// 		success: false
		// 	});

		// }

	});
};

/**
 * Channel add/remove sketch by ID
 */

exports.channel = function (req, res) {
	// find sketch
	Media.model.findById(req.params.id).exec(function (err, item) {

		if (err) return res.apiError('database error', err);
		if (!item) return res.apiError('not found');

		var sketchChannels = [];
		var alreadyInChannel = false;
		// add existing channels to array
		for (var i = 0; i < item.channels.length; i++) {
			// check if channel is already added
			if (item.channels[i] == req.query._id) {
				alreadyInChannel = true; // skip adding
			} else {
				// keep current channel if not the same channel in request
				sketchChannels.push(item.channels[i]);
			}
		}
		// add new channel if it wasnt already added
		if (alreadyInChannel == false) {
			sketchChannels.push(req.query._id);
		}
		var data = {
			channels: sketchChannels
		};
		// run the database update
		item.getUpdateHandler(req).process(data, function (err) {
			if (err) {
				return res.apiError('error updating media channel', err);
			} else {
				res.apiResponse({
					success: true
				});
			}
		});
		// item.state = 'archived';
		// item.save(function (err) {
		// 	if (err) {
		// 		return res.err(err);
		// 	} else {
		// 		res.apiResponse({
		// 			success: true
		// 		});
		// 	}

		// });
	});
};

/**
 * Subscribe to channel
 */

exports.subscribe = function (req, res) {
	//
	//var MediaChannel = keystone.list('MediaChannel');
	var newChannel = new MediaChannel.model();
	var newUpdater = newChannel.getUpdateHandler(req);
	var data = {
		name: req.query.name
	};
	newUpdater.process(data, {
		flashErrors: true
	}, function (err) {
		if (err) {
			return res.apiError({
				success: false,
				note: 'could not subscribe to channel'
			});
		}else{
			return res.apiResponse({
				success: true,
				note: 'subscribed to channel'
			});
		}
	});
	// // find sketch
	// Sketch.model.findById(req.params.id).exec(function (err, item) {

	// 	if (err) return res.apiError('database error', err);
	// 	if (!item) return res.apiError('not found');

	// 	item.state = 'archived';
	// 	item.save(function (err) {
	// 		if (err) {
	// 			return res.err(err);
	// 		} else {
	// 			res.apiResponse({
	// 				success: true
	// 			});
	// 		}

	// 	});
	// });
};

/**
 * Unsubscribe to channel
 */

exports.unsubscribe = function (req, res) {
	// TODO: find and remove sketches in channel before deleting channel
	// remove channel from database
	MediaChannel.model.findById(req.query.id).exec(function(err, item) {
		if(err) {
			return apiError({
				success: false,
				note: 'could not find channel in database'
			});
		}
		if(!item) {
			return res.apiError({
				success: false,
				note: 'could not get channel from database'
			});
		}
		item.remove(function(err) {
			if(err) {
				return res.apiError({
					success: false,
					note: 'could not remove channel from database'
				});
			}
			return res.apiResponse({
				success: true,
				note: 'deleted channel'
			});
		});
	});
};



/**
 * Delete/unpublish Sketch by ID
 */

exports.remove = function (req, res) {
	// find sketch
	Media.model.findById(req.params.id).exec(function (err, item) {

		if (err) return res.apiError('database error', err);
		if (!item) return res.apiError('not found');

		item.state = 'archived';
		item.save(function (err) {
			if (err) {
				return res.err(err);
			} else {
				res.apiResponse({
					success: true
				});
			}

		});
	});
};

/**
 * Screenshot sketch by ID
 */

exports.screenshot = function (req, res) {
	// no player
	if (!isDplayerConnected) {
		console.log('play error: player not connected');
		return res.apiError({
			success: false
		});
	}
	// find sketch
	Media.model.findById(req.params.id).exec(function (err, item) {
		if (err) return res.apiError('database error', err);
		if (!item) return res.apiError('not found');
		// prep to save screenshot
		var sys = require('sys');
		var exec = require('child_process').exec;
		var uploadName = 'screenshot_' + (Math.random().toString(36).substr(2, 6)) + '.png';
		var uploadPath = res.locals.staticPath + item.localDir + '/' + uploadName;
		var execCommand = 'import -window root -display :0.0 ' + uploadPath;
		console.log('saving screenshot to: ' + uploadPath);
		// save screenshot
		exec(execCommand, function (err, stdout, stderr) {
			console.log(stdout);
			if (err) {
				console.log('screenshot error: ');
				return res.apiError({
					success: false
				});
			};
			// add screenshot filename to database
			// Sketch.model.findById(locals.data.sketch.id).exec(function (err, item) {
			// 	if (err) {
			// req.flash('warning', 'not done');
			// return res.redirect('/media/' + locals.data.sketch.slug);
			// }
			var imgs = {
				thumbnails: item.thumbnails
			};
			imgs.thumbnails.push(uploadName);
			Media.updateItem(item, imgs, {
				fields: ["thumbnails"]
			}, function (dberror) {
				if (dberror) {
					console.log('db error: ' + dberror);
					return res.apiError({
						success: false
					});
					// req.flash('warning', 'not done');
					// return res.redirect('/media/' + locals.data.sketch.slug);
				}
			});
			// })
			// let updater = locals.data.sketch.getUpdateHandler(req, res, {
			// 	errorMessage: 'error updating sketch with screenshot'
			// });
			// updater.process()
			console.log('thumbnails: ' + item.thumbnails);
			if (err) {
				return res.apiError({
					success: false
				});
				// req.flash('warning', 'not done');
				// return res.redirect('/media/' + locals.data.sketch.slug);
			} else {
				res.apiResponse({
					success: true
				});
				// req.flash('success', 'done');
				// return res.redirect('/media/' + locals.data.sketch.slug);
			}
		});

	});


	// Sketch.model.findById(req.params.id).exec(function (err, item) {

	// 	if (err) return res.apiError('database error', err);
	// 	if (!item) return res.apiError('not found');

	// 	if (ipc.of.dplayeripc) {
	// 		var sketchPath = 'file:///' + res.locals.staticPath + item.localDir + '/index.html';
	// 		ipc.of.dplayeripc.emit('message', sketchPath);
	// 		console.log('yes');

	// 		res.apiResponse({
	// 			success: true
	// 		});
	// 	} else {
	// 		console.log('neswsfo');

	// 		res.apiError({
	// 			success: false
	// 		});

	// 	}

	// });
};

/**
 * Screenshot renderer
 */

exports.savescreen = function (req, res) {
	// no player
	if (!isDplayerConnected) {
		console.log('play error: player not connected');
		return res.apiError({
			success: false,
			note: 'renderer not active'
		});
	}
	// prep to save screenshot
	var sys = require('sys');
	var exec = require('child_process').exec;
	var uploadName = 'screenshot.png';
	var uploadPath = path.join(__dirname, './../../public') + '/' + uploadName;
	var execCommand = 'import -window root -display :0.0 ' + uploadPath;
	console.log('saving screenshot to: ' + uploadPath);
	// save screenshot
	exec(execCommand, function (err, stdout, stderr) {
		console.log(stdout);
		if (err) {
			console.log('screenshot error: ');
			return res.apiError({
				success: false,
				note: 'could not save screenshot'
			});
		} else {
			return res.apiResponse({
				success: true,
				note: 'saved screenshot'
			});
		}
	});
};


/**
 * Sync Sketch to IPFS
 */

exports.share = function (req, res) {
	Media.model.findById(req.params.id).exec(function (err, item) {

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

				Media.updateItem(item, data, {
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

/**
 * Play Sketch by URL
 */

exports.queue = function (req, res) {
	
	if (!isDplayerConnected) {
		console.log('play error: player not connected');

		return res.apiError({
			success: false,
			note: 'renderer not connected'
		});

	}

	if (ipc.of.dplayeripc) {
		var sketchPath = req.body.address;
		ipc.of.dplayeripc.emit('message', sketchPath);
		return res.apiResponse({
			success: true,
			note: 'queued sketch URL'
		});
	} else {

		return res.apiError({
			success: false,
			note: 'could not queue sketch URL'
		});

	}

	// Sketch.model.findById(req.params.id).exec(function (err, item) {

	// 	if (err) return res.apiError('database error', err);
	// 	if (!item) return res.apiError('not found');

	// 	if (ipc.of.dplayeripc) {
	// 		var sketchPath = 'file:///' + res.locals.staticPath + item.localDir + '/index.html';
	// 		ipc.of.dplayeripc.emit('message', sketchPath);
	// 		console.log('yes');

	// 		res.apiResponse({
	// 			success: true
	// 		});
	// 	} else {
	// 		console.log('neswsfo');

	// 		res.apiError({
	// 			success: false
	// 		});

	// 	}

	// });
};

/**
 * Drop database and rebuild after scanning directories
 */

exports.initialise = function(req, res) {
	// load Profile (colour calibration/hyperion config)
	var hyperionConfigPath = path.join(res.locals.configStaticPath, '/hyperion.config.json');
	var hyperionConfExists = fs.existsSync(hyperionConfigPath);
	if(hyperionConfExists){
		var hyperionConfig = fs.readFileSync(hyperionConfigPath);
        if(!hyperionConfig){
			//
			console.log('could not find hyperion config file in media init');
        }else{
			var hyperionConfigJSON = JSON.parse(hyperionConfig);
			keystone.list('Profile').model.find().exec(function (err, results) {
				if (err || !results.length) {
					console.log('could not get Profile from database');
				}
				// shorthand
				var profile = results[0];
				var hyperionChannels = hyperionConfigJSON.color.channelAdjustment[0];
				// set profile from JSON
				profile.colOrder = hyperionConfigJSON.device.colorOrder;
				profile.redR = hyperionChannels.pureRed.redChannel;
				profile.redG = hyperionChannels.pureRed.greenChannel;
				profile.redB = hyperionChannels.pureRed.blueChannel;
				profile.greenR = hyperionChannels.pureGreen.redChannel;
				profile.greenG = hyperionChannels.pureGreen.greenChannel;
				profile.greenB = hyperionChannels.pureGreen.blueChannel;
				profile.blueR = hyperionChannels.pureBlue.redChannel;
				profile.blueG = hyperionChannels.pureBlue.greenChannel;
				profile.blueb = hyperionChannels.pureBlue.blueChannel;
				// save profile
				profile.save(function(err) {
					if(err){
						return res.apiError({
							success: false,
							note: 'could not initialise profile'
						});
					}else{
						console.log('initialised profile from saved config');
					}
				});
			});
		}
	}
	// drop sketches in database
	Media.model.find(function (err, items) {

		if (err) {
			return res.apiError({
				success: false,
				note: 'could not get media from database: '+ err
			});
		}
		// console.log(items.length);
		for(var i=0; i<items.length; i++){
			items[i].remove(function(err){
				if(err){
					return res.apiError({
						success: false,
						note: 'could not drop media from database'
					});
				}

			});
			// items[i].state = 'archived';
			// items[i].save(function(err) {
			// 	if(err) {
			// 		return res.apiError({
			// 			success: false,
			// 			note: 'could not drop sketch from database'
			// 		});
			// 	}
			// })
		}
	});
	// drop channels in database
	MediaChannel.model.find(function (err, items) {

		if (err) {
			return res.apiError({
				success: false,
				note: 'could not get channels from database: '+ err
			});
		}
		// console.log(items.length);
		for(var i=0; i<items.length; i++){
			items[i].remove(function(err){
				if(err){
					return res.apiError({
						success: false,
						note: 'could not drop channel from database'
					});
				}
				// 
			});
			// items[i].state = 'archived';
			// items[i].save(function(err) {
			// 	if(err) {
			// 		return res.apiError({
			// 			success: false,
			// 			note: 'could not drop sketch from database'
			// 		});
			// 	}
			// })
		}
	});
	// scan sketch directory
	var newItems = {
		MediaChannel: [{
			'name': 'sketches',
			'__ref': 'sketches'
		}],
		Media: []
	};
	// scan sketch directory
	fs.readdir(res.locals.viewStaticPath, function(err, files) {
		if(err){
			return res.apiError({
				success: false,
				note: 'could not read media folder'
			});
		}
		// iterate through each sketch directory
		for(var i=0; i<=files.length; i++){
			// store sketch db info
			if(i < files.length){
				// check for disk.json
				var diskJSONpath = path.join(res.locals.viewStaticPath + files[i] + '/disk.json');
				var exists = fs.existsSync(diskJSONpath);
				if(exists){
					// read json
					var rawDiskJSON = fs.readFileSync(diskJSONpath);
					if(!rawDiskJSON) {
						console.log('could not read media details');
						return res.apiError({
							success: false,
							note: 'could not read media details'
						});
					}else{
						// add sketch to database
						var obj = JSON.parse(rawDiskJSON);
						newItems.Media.push({
							"title": obj.disk.title?obj.disk.title:files[i],
							"modifiedDate": obj.disk.modifiedDate?obj.disk.modifiedDate:"2018-1-1",
							"prefThumb":obj.disk.prefThumb?obj.disk.prefThumb:null,
							"state": obj.disk.state?obj.disk.state:"published",
							"ipfsHash": obj.disk.ipfsHash?obj.disk.ipfsHash:null,
							"localDir": files[i],
							"channels": obj.disk.channels?obj.disk.channels:"sketches",
						});
					}
				}else{
					// TODO make disk.json
					// add sketch to db
					newItems.Media.push({
						"title": files[i],
						"state": "published",
						"localDir": files[i],
						"channels": "sketches",
					});
				}
			}else{
				// add to database when all sketches are added
				keystone.createItems(newItems, function(err, stats) {
					if(err){
						return res.apiError({
							success: false,
							note: 'could not update database '+err
						});
					}else{
						res.apiResponse({
							success: true,
							note: 'added sketches to database',
							list: newItems,
						});
					}
				});				
			}
		}
	});
};