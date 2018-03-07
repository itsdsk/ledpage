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

Sketch.add({
	title: { type: String, required: true },
	state: { type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true },
	author: { type: Types.Relationship, ref: 'User', index: true },
	publishedDate: { type: Types.Date, index: true, dependsOn: { state: 'published' } },
	//image: { type: Types.CloudinaryImage },
	//content: {
	//	brief: { type: Types.Html, wysiwyg: true, height: 150 },
	//	extended: { type: Types.Html, wysiwyg: true, height: 400 },
	//},
	localPath: { type: String },
	ipnsHash: { type: Types.Key },
	ipfsHash: { type: Types.Key },
	categories: { type: Types.Relationship, ref: 'SketchCategory', many: true },
});

//Sketch.schema.virtual('content.full').get(function () {
//	//return this.content.extended || this.content.brief;
//	return this.localPath;
//});

Sketch.defaultColumns = 'title, state|20%, author|20%, publishedDate|20%';
Sketch.register();
