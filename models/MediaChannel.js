var keystone = require('keystone');

/**
 * MediaChannel Model
 * ==================
 */

var MediaChannel = new keystone.List('MediaChannel', {
	autokey: { from: 'name', path: 'key', unique: true },
});

MediaChannel.add({
	name: { type: String, required: true },
});

MediaChannel.relationship({ ref: 'Media', path: 'sketches', refPath: 'channels' });

MediaChannel.register();
