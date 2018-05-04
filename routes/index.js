/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

var keystone = require('keystone');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
var routes = {
	views: importRoutes('./views'),
	api: importRoutes('./api')
};

// redirect
//keystone.redirect('/', '/browse/');

// Setup Route Bindings
exports = module.exports = function (app) {
	// Views
	app.get('/', routes.views.browse);
	app.get('/browse/:channel?', routes.views.browse);
	app.all('/browse/sketch/:id', routes.views.sketch);
	app.all('/upload', routes.views.upload);
	app.all('/setup', routes.views.setup);

	// public API
	app.all('/api*', keystone.middleware.api);
	// app.get('/api/sketch/list', keystone.middleware.api, routes.api.sketch.list); // list sketches
	app.get('/api/sketch/:ipfs/add', keystone.middleware.api, routes.api.sketch.add); // try add ipfs hash
	// app.get('/api/sketch/:id', keystone.middleware.api, routes.api.sketch.getSketch); // info on specific sketch
	// app.get('/api/sketch/:id/play', keystone.middleware.api, routes.api.sketch.play); // play sketch
	// app.all('/api/sketch/:id/update', keystone.middleware.api, routes.api.sketch.update); // update sketch
	// app.get('/api/sketch/:id/channel', keystone.middleware.api, routes.api.sketch.channel); // channel add/remove sketch
	// app.get('/api/sketch/:id/delete', keystone.middleware.api, routes.api.sketch.delete); // delete/unpublish sketch
	// app.get('/api/sketch/:id/screenshot', keystone.middleware.api, routes.api.sketch.screenshot); // save screenshot of sketch
	// app.get('/api/channels/subscribe', keystone.middleware.api, routes.api.sketch.subscribe); // subscribe to new channel
	// app.get('/api/sketch/:id/sync', keystone.middleware.api, routes.api.sketch.sync); // upload sketch to ipfs

	app.get('/api/player', keystone.middleware.api, routes.api.sketch.player); // player status
	app.get('/api/display/brightness', keystone.middleware.api, routes.api.sketch.getBrightness); // 

	// Media routes
	app.get('/api/media/list', keystone.middleware.api, routes.api.media.list); // list sketches
	app.get('/api/media/:id', keystone.middleware.api, routes.api.media.get); // info on specific sketch
	app.get('/api/media/:id/play', keystone.middleware.api, routes.api.media.play); // play sketch
	// app.all('/api/media/:id/create', keystone.middleware.api, routes.api.media.create); // create new sketch
	app.all('/api/media/:id/update', keystone.middleware.api, routes.api.media.update); // update sketch
	app.get('/api/media/:id/channel', keystone.middleware.api, routes.api.media.channel); // channel add/remove sketch
	app.get('/api/media/:id/remove', keystone.middleware.api, routes.api.media.remove); // delete/unpublish sketch
	app.get('/api/media/:id/screenshot', keystone.middleware.api, routes.api.media.screenshot); // save screenshot of sketch
	app.get('/api/media/:id/share', keystone.middleware.api, routes.api.media.share); // upload sketch to ipfs
	app.get('/api/media/channel/subscribe', keystone.middleware.api, routes.api.media.subscribe); // subscribe to new channel


	// LED routes
	app.all('/api/leds/map-positions', keystone.middleware.api, routes.api.leds.map_positions); // update player led map
	app.get('/api/leds/set-brightness/:val', keystone.middleware.api, routes.api.leds.set_brightness); // 
	app.all('/api/leds/config-arduino', keystone.middleware.api, routes.api.leds.config_arduino); // setup led output configuration

	app.get('/api/ipfs', keystone.middleware.api, routes.api.sketch.ipfs);

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);

};