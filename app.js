// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
  'cookie secret': '05f8261c27d0ac4751627b469d7e2d9b84246bbbc4b68edc3c5b530af1010560ac63182ff59adce22e5ff44ab6e66075bd460e89803a818c183c9f4f2049e260',
  'name': 'Disks',
  'port': parseInt(process.env.PORT || 80, 10),
  'sass': 'public',
  'static': ['public', '/data/content'],
  'favicon': 'public/favicon.ico',
  'views': 'templates/views',
  'view engine': 'pug',
  'auto update': true,
  'session': false,
  'auth': false,
  'user model': 'Profile',
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

// Load your project's Routes
keystone.set('routes', require('./routes'));

keystone.start(function () {
  // check media on app launch
  var mediaListURL = 'http://0.0.0.0:'+parseInt(process.env.PORT || 80, 10) + '/api/media/list';
  var http = require('http');
  http.get(mediaListURL, (response) => {
    // recieve media list
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });
    // whole response has been recieved
    response.on('end', () => {
      var mediaList = JSON.parse(data);
      if(mediaList.media.length < 1){
        http.get(mediaListURL+'/init');
      }else{
        console.log('Loaded ' + mediaList.media.length + ' items in ' + mediaList.channels.length + ' channels');
      }
    });
  });
});