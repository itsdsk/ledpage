var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */
var Profile = new keystone.List('Profile');

Profile.add({
	name: {
		type: String,
		initial: true,
		required: true,
		unique: true,
		index: true
	},
	brightness: {
		type: Types.Number,
		default: 1.0
	},
	ledRadiusScale: {
		type: Types.Number,
		default: 1.0
	},
	colOrder: {
		type: Types.Select,
		options: 'rgb, rbg, brg, bgr, gbr, grb',
		default: 'rgb'
	},
	redR: {
		type: Types.Number,
		default: 255
	},
	redG: {
		type: Types.Number,
		default: 0
	},
	redB: {
		type: Types.Number,
		default: 0
	},
	greenR: {
		type: Types.Number,
		default: 0
	},
	greenG: {
		type: Types.Number,
		default: 255
	},
	greenB: {
		type: Types.Number,
		default: 0
	},
	blueR: {
		type: Types.Number,
		default: 0
	},
	blueG: {
		type: Types.Number,
		default: 0
	},
	blueB: {
		type: Types.Number,
		default: 255
	},

});

Profile.register();