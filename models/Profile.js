var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */
var Profile = new keystone.List('Profile');

Profile.add({
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
		default: 255
	},
	redB: {
		type: Types.Number,
		default: 255
	},
	greenR: {
		type: Types.Number,
		default: 255
	},
	greenG: {
		type: Types.Number,
		default: 255
	},
	greenB: {
		type: Types.Number,
		default: 255
	},
	blueR: {
		type: Types.Number,
		default: 255
	},
	blueG: {
		type: Types.Number,
		default: 255
	},
	blueB: {
		type: Types.Number,
		default: 255
	},

	// name: {
	// 	type: Types.Name,
	// 	required: true,
	// 	index: true
	// },
	name: {
		type: String,
		initial: true,
		required: true,
		unique: true,
		index: true
	},
	// email: { type: Types.Email, initial: true, required: true, unique: true, index: true },
	// password: { type: Types.Password, initial: true, required: true },
// }, 'Permissions', {
// 	isAdmin: {
// 		type: Boolean,
// 		label: 'Can access Keystone',
// 		index: true
	// },
});

// Provide access to Keystone
Profile.schema.virtual('canAccessKeystone').get(function () {
	return this.isAdmin;
});


/**
 * Relationships
 */
Profile.relationship({
	ref: 'Media',
	path: 'sketches',
	refPath: 'author'
});


/**
 * Registration
 */
Profile.defaultColumns = 'name, email, isAdmin';
Profile.register();