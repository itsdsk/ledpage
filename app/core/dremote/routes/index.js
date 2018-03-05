var keystone = require('keystone');
var importRoutes = keystone.importer(__dirname);

var routes = {
  views: importRoutes('./views'),
  api: importRoutes('./api'),
};

exports = module.exports = function (app) {
  app.get('/', routes.views.index)
  app.get('/add-sketch', routes.views.addSketch)
  app.post('/api/sketch', api.sketch.post)
};