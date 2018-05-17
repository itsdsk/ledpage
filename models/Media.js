var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Media Model
 * ==========
 */

var Media = new keystone.List('Media', {
	map: {
		name: 'title'
	},
	autokey: {
		path: 'slug',
		from: 'title',
		unique: true
	},
});

Media.add({
	title: {
		type: String,
		required: true
	},
	modifiedDate: {
		type: Types.Date,
		index: true
	},
	localDir: {
		type: Types.Key
	},
	thumbnails: {
		type: Types.TextArray
	},
	prefThumb: {
		type: String
	},
	ipfsHash: {
		type: String
	},
	channels: {
		type: Types.Relationship,
		ref: 'MediaChannel',
		many: true
	},
	state: {
		type: Types.Select,
		options: 'draft, published, archived',
		default: 'published',
		index: true
	},
	publishedDate: {
		type: Types.Date,
		index: true,
		dependsOn: {
			state: 'published'
		}
	},
});

Media.register();