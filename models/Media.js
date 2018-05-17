var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Media Model
 * ==========
 */

var Media = new keystone.List('Media', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true },
});

//
var myStorage = new keystone.Storage({
	adapter: keystone.Storage.Adapters.FS,
	fs: {
	  path: keystone.expandPath('./public/uploads/files'), // required; path where the files should be stored
	  publicPath: '/public/uploads/files', // path where files will be served
	}
  });

Media.add({
	title: { type: String, required: true },
	modifiedDate: { type: Types.Date, index: true },
	localDir: { type: String },
	thumbnails: { type: Types.TextArray },
	prefThumb: { type: String},
	ipfsHash: { type: String },
	image: {
		type: Types.File,
		storage: myStorage
	},
	channels: { type: Types.Relationship, ref: 'MediaChannel', many: true },


	state: { type: Types.Select, options: 'draft, published, archived', default: 'published', index: true },
	publishedDate: { type: Types.Date, index: true, dependsOn: { state: 'published' } },
});

Media.register();
