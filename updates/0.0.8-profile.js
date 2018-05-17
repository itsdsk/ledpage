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
			name: 'defaultProfile',
			brightness: 1.0,
			ledRadiusScale: 1.0,
			colOrder: 'rgb',
			redR: 255,
			redG: 0,
			redB: 0,
			greenR: 0,
			greenG: 255,
			greenB: 0,
			blueR: 0,
			blueG: 0,
			blueB: 255
		})
		.save(done);
};