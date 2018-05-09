/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */

var keystone = require('keystone');
var Profile = keystone.list('Profile');

module.exports = function (done) {
	Profile.model.find(function (err, items) {
		for (var i = 0; i < items.length; i++) {
			items[i].remove();
		}
	});
	new Profile.model({
			colOrder: 'rgb',
			redR: 255,
			redG: 0,
			redB: 0,
			greenR: 0,
			greenG: 255,
			greenB: 0,
			blueR: 0,
			blueG: 0,
			blueB: 255,
			name: 'defaultProfile'
		})
		.save(done);
};

// exports.create = {
// 	Profile: [{
// 		'colOrder': 'rgb',
// 		'redR': 255,
// 		'redG': 255,
// 		'redB': 255,
// 		'greenR': 255,
// 		'greenG': 255,
// 		'greenB': 255,
// 		'blueR': 255,
// 		'blueG': 255,
// 		'blueB': 255,
// 		'name': 'defaultProfile'
// 	}, ],
// };

/*

// This is the long-hand version of the functionality above:

var keystone = require('keystone');
var async = require('async');
var User = keystone.list('User');

var admins = [
	{ email: 'user@keystonejs.com', password: 'admin', name: { first: 'Admin', last: 'User' } }
];

function createAdmin (admin, done) {

	var newAdmin = new User.model(admin);

	newAdmin.isAdmin = true;
	newAdmin.save(function (err) {
		if (err) {
			console.error('Error adding admin ' + admin.email + ' to the database:');
			console.error(err);
		} else {
			console.log('Added admin ' + admin.email + ' to the database.');
		}
		done(err);
	});

}

exports = module.exports = function (done) {
	async.forEach(admins, createAdmin, done);
};

*/