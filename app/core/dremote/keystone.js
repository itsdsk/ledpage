// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');
//const ipc = require('node-ipc');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
  'cookie secret': '05f8261c27d0ac4751627b469d7e2d9b84246bbbc4b68edc3c5b530af1010560ac63182ff59adce22e5ff44ab6e66075bd460e89803a818c183c9f4f2049e260',
  'name': 'Sketch Browser',
  'port': 8081,
  'sass': 'public',
  'static': ['public', '/data/content'],
  'favicon': 'public/favicon.ico',
  'views': 'templates/views',
  'view engine': 'pug',

  'auto update': true,
  'session': false,
  'auth': false,
  'user model': 'User',
});

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
  _: require('lodash'),
  utils: keystone.utils,
  editable: keystone.content.editable,
});

// // ipc
// ipc.config.id = 'dremoteipc';
// ipc.config.retry = 1500;
// ipc.connectTo(
//   'dplayeripc',
//   function () {
//     ipc.of.dplayeripc.on(
//       'connect',
//       function () {
//         console.log("IPC connected");
//       }
//     )
//   });


// Load your project's Routes
keystone.set('routes', require('./routes'));

keystone.start();