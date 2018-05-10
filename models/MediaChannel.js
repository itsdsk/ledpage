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

MediaChannel.relationship({ path: 'media', ref: 'Media', refPath: 'channels' });

MediaChannel.track = true;
MediaChannel.register();
