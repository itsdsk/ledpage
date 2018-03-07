var keystone = require('keystone');

/**
 * SketchCategory Model
 * ==================
 */

var SketchCategory = new keystone.List('SketchCategory', {
	autokey: { from: 'name', path: 'key', unique: true },
});

SketchCategory.add({
	name: { type: String, required: true },
});

SketchCategory.relationship({ ref: 'Sketch', path: 'sketches', refPath: 'categories' });

SketchCategory.register();
