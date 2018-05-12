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
var componentStatus = [{
		name: 'player',
		active: true
	},
	{
		name: 'peer-to-peer network',
		active: true
	},
	{
		name: 'LED controller',
		active: true
	}
];
setInterval(function () {
	// player
	exec("ls /tmp/app.dplayeripc", function (err, stdout, stderr) {
		if (stdout.length == 0) {
			componentStatus[0].active = false;
		} else {
			componentStatus[0].active = true;
		}
	});
	// ipfs
	exec("lsof -i :5001", function (err, stdout, stderr) {
		if (stdout.length == 0) {
			componentStatus[1].active = false;
		} else {
			componentStatus[1].active = true;
		}
	});
	// hyperion
	exec("lsof -i :19444", function (err, stdout, stderr) {
		if (stdout.length == 0) {
			componentStatus[2].active = false;
		} else {
			componentStatus[2].active = true;
		}
	});
}, 5000);

exports.initLocals = function (req, res, next) {
	// navigation bar items
	res.locals.navLinks = [{
			label: '☍ Upload',
			key: 'upload',
			href: '/upload'
		},
		{
			label: '☌ Setup',
			key: 'setup',
			href: '/setup'
		}
	];
	// local directory constants
	const publicPath = (process.env.D1_DATA_PATH ? process.env.D1_DATA_PATH : '/data/content/');
	res.locals.staticPath = publicPath + "view-static/";
	res.locals.viewStaticPath = publicPath + "view-static/";
	res.locals.configStaticPath = publicPath + "config-static/";

	// component status
	res.locals.componentStatus = componentStatus;
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