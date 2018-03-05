var keystone = require('keystone');

keystone.init({
  'cookie secret': '05f8261c27d0ac4751627b469d7e2d9b84246bbbc4b68edc3c5b530af1010560ac63182ff59adce22e5ff44ab6e66075bd460e89803a818c183c9f4f2049e260',
  'name': 'sketches',
  'port': 8081,
  'views': 'templates/views',
  'view engine': 'pug',

	'user model': 'Account',
	'auto update': true,
	'session': true,
	'auth': true,

});

keystone.import('models');

keystone.set('routes', require('./routes'));

keystone.start();
