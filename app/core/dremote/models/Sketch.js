var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Sketch Model
 * ==========
 */

var Sketch = new keystone.List('Sketch', {
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

Sketch.add({
	title: { type: String, required: true },
	modifiedDate: { type: Types.Date, index: true },
	//localPath: { type: String },
	localDir: { type: String },
	ipnsHash: { type: String },
	ipfsHash: { type: String },
	image: {
		type: Types.File,
		storage: myStorage
	},
	channels: { type: Types.Relationship, ref: 'SketchChannel', many: true },


	state: { type: Types.Select, options: 'draft, published, archived', default: 'published', index: true },
	//author: { type: Types.Relationship, ref: 'User', index: true },
	publishedDate: { type: Types.Date, index: true, dependsOn: { state: 'published' } },
	//image: { type: Types.CloudinaryImage },
	//content: {
	//	brief: { type: Types.Html, wysiwyg: true, height: 150 },
	//	extended: { type: Types.Html, wysiwyg: true, height: 400 },
	//},
});

//Sketch.schema.virtual('content.full').get(function () {
//	//return this.content.extended || this.content.brief;
//	return this.localPath;
//});

Sketch.defaultColumns = 'title, state|20%, author|20%, publishedDate|20%';
Sketch.register();
