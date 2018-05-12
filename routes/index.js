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

// Setup Route Bindings
exports = module.exports = function (app) {
	// Views
	app.get('/', routes.views.index);
	app.get('/channel/:channel?', routes.views.index);
	app.get('/media/:id', routes.views.media);
	app.get('/upload', routes.views.upload);
	app.all('/setup', routes.views.setup);

	// API
	app.all('/api*', keystone.middleware.api);
	app.get('/api/identity', keystone.middleware.api, routes.api.media.identity); // get IPFS identity
	app.all('/api/screenshot', keystone.middleware.api, routes.api.media.savescreen); // save screenshot
	app.get('/api/system/reboot', keystone.middleware.api, routes.api.leds.reboot); // reboot device
	app.get('/api/system/shutdown', keystone.middleware.api, routes.api.leds.shutdown); // shutdown device

	// Media routes
	app.all('/api/media/create', keystone.middleware.api, routes.api.media.create); // create new sketch
	app.all('/api/media/queue', keystone.middleware.api, routes.api.media.queue); // display URL
	app.get('/api/media/list', keystone.middleware.api, routes.api.media.list); // list sketches and channels
	app.get('/api/media/list/init', keystone.middleware.api, routes.api.media.initialise); // drop db and scan sketch dir
	app.get('/api/media/:id', keystone.middleware.api, routes.api.media.get); // info on specific sketch
	app.get('/api/media/:id/play', keystone.middleware.api, routes.api.media.play); // play sketch
	app.all('/api/media/:id/update', keystone.middleware.api, routes.api.media.update); // update sketch
	app.get('/api/media/:id/channel', keystone.middleware.api, routes.api.media.channel); // channel add/remove sketch
	app.get('/api/media/:id/remove', keystone.middleware.api, routes.api.media.remove); // delete/unpublish sketch
	app.get('/api/media/:id/screenshot', keystone.middleware.api, routes.api.media.screenshot); // save screenshot of sketch
	app.get('/api/media/:id/share', keystone.middleware.api, routes.api.media.share); // upload sketch to ipfs
	app.get('/api/media/:ipfs/download', keystone.middleware.api, routes.api.media.download); // download media from ipfs hash
	app.get('/api/media/channel/subscribe', keystone.middleware.api, routes.api.media.subscribe); // subscribe to new channel
	app.get('/api/media/channel/unsubscribe', keystone.middleware.api, routes.api.media.unsubscribe); // unsubscribe from channel
	app.get('/api/media/channel/autoplay', keystone.middleware.api, routes.api.media.autoplay); // display collection of media cyclically

	// LED routes
	app.all('/api/leds/map-positions', keystone.middleware.api, routes.api.leds.map_positions); // update player led map
	app.all('/api/leds/calibrate', keystone.middleware.api, routes.api.leds.calibrate); // update colour calibration
	app.get('/api/leds/set-brightness/:val', keystone.middleware.api, routes.api.leds.set_brightness); // 
	app.all('/api/leds/config-arduino', keystone.middleware.api, routes.api.leds.config_arduino); // setup led output configuration
};