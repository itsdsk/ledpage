var keystone = require('keystone');

/**
 * SketchChannel Model
 * ==================
 */

var SketchChannel = new keystone.List('SketchChannel', {
	autokey: { from: 'name', path: 'key', unique: true },
});

SketchChannel.add({
	name: { type: String, required: true },
});

SketchChannel.relationship({ ref: 'Sketch', path: 'sketches', refPath: 'channels' });

SketchChannel.register();
