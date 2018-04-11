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
keystone.redirect('/', '/browse/');

// Setup Route Bindings
exports = module.exports = function (app) {
	// Views
	//app.get('/', routes.views.index);
	app.get('/browse/:channel?', routes.views.browse);
	app.get('/browse/sketch/:sketch', routes.views.sketch);
	app.all('/upload', routes.views.upload);
	app.all('/setup', routes.views.setup);

	// public API
	app.all('/api*', keystone.middleware.api);
	app.get('/api/sketch/list', keystone.middleware.api, routes.api.sketch.list); // list sketches
	app.get('/api/sketch/:ipfs/add', keystone.middleware.api, routes.api.sketch.add); // try add ipfs hash
	app.get('/api/sketch/:id', keystone.middleware.api, routes.api.sketch.getSketch); // info on specific sketch
	app.get('/api/sketch/:id/play', keystone.middleware.api, routes.api.sketch.play); // play sketch
	app.get('/api/player', keystone.middleware.api, routes.api.sketch.player); // player status
	app.all('/api/player/map', keystone.middleware.api, routes.api.sketch.mapleds); // update player led map
	app.get('/api/sketch/:id/sync', keystone.middleware.api, routes.api.sketch.sync); // upload sketch to ipfs
	app.get('/api/display/brightness/:val', keystone.middleware.api, routes.api.sketch.setBrightness); // 
	app.get('/api/display/brightness', keystone.middleware.api, routes.api.sketch.getBrightness); // 

	app.get('/api/ipfs', keystone.middleware.api, routes.api.sketch.ipfs);

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);

};
