/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */
var _ = require('lodash');
//var ipfsAPI = require('ipfs-api');
//var http = require('http');

console.log('routes middleware');
/**
	Initialises the standard view locals

	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/
exports.initLocals = function (req, res, next) {
	res.locals.navLinks = [
		{ label: 'Home', key: 'home', href: '/browse' },
		{ label: 'Upload', key: 'upload', href: '/upload' },
		//{ label: 'Setup', key: 'display', href: '/setup' },
		//{ label: 'Gallery', key: 'gallery', href: '/gallery' },
	];

	res.locals.staticPath = "/data/content/view-static/";

	res.locals.user = req.user;
	// ipfs
	// res.locals.ipfs = ipfsAPI('localhost', '5001', {
	// 	protocol: 'http'
	// });

	// http.request('http://0.0.0.0:8081/api/player', (res) =>
	// {
	// 	res.on('error', function() {
	// 		req.flash('error', 'Error: No connection to sketch player');
	// 		next();
	// 	})
	// }).end();
	//req.flash('error', '<div id="rsgf">'+'Error: No connection to sketch player'+'</div>');
	//req.flash('error', 'Error: No peer to peer connection');
	//req.flash('info', 'Error: No connection to sketch player');
	//req.flash('warning', 'Error: No connection to sketch player');
	next();
};


/**
	Fetches and clears the flashMessages before a view is rendered
*/
exports.flashMessages = function (req, res, next) {
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error'),
	};
	res.locals.messages = _.some(flashMessages, function (msgs) {
		return msgs.length;
	}) ? flashMessages : false;
	next();
};


/**
	Prevents people from accessing protected pages when they're not signed in
 */
exports.requireUser = function (req, res, next) {
	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/keystone/signin');
	} else {
		next();
	}
};