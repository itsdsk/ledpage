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
var exec = require('child_process').exec;

/**
	Initialises the standard view locals

	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/
exports.initLocals = function (req, res, next) {
	res.locals.navLinks = [{
		label: '⁂ Upload',
		key: 'upload',
		href: '/upload'
	}, ];
	const publicPath = '/data/content/';
	//const publicPath = './public/';
	res.locals.staticPath = publicPath + "view-static/";
	res.locals.configStaticPath = publicPath + "config-static/";
	// check component status
	function execCmd(cmdString) {
		exec(cmdString, function (err, stdout, stderr) {
			if (stdout.length == 0) {
				return false;
			} else {
				return true;
			}
		});
	}
	res.locals.componentStatus = [{
			name: 'player',
			active: (execCmd("ls /tmp/app.dplayeripc") ? true : false)
		},
		{
			name: 'peer-to-peer network',
			active: (execCmd("lsof -i :5001") ? true : false)
		},
		{
			name: 'LED controller',
			active: (execCmd("lsof -i :19444") ? true : false)
		}
	];
	res.locals.user = req.user;
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