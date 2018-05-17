var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * MediaChannel Model
 * ==================
 */

var MediaChannel = new keystone.List('MediaChannel', {
	autokey: { from: 'name', path: 'key', unique: true },
});

MediaChannel.add({
	name: { type: Types.Key, required: true },
});

MediaChannel.relationship({ path: 'media', ref: 'Media', refPath: 'channels' });

MediaChannel.register();
