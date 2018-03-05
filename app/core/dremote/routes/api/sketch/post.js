var keystone = require('keystone');
var Sketch = keystone.list('Sketch');

module.exports = function (req, res) {
  if (!req.body.name || !req.body.description) {
    return res.sendError({ status: 'incomplete data set' });
  }

  var newSketch = new Sketch();
  Sketch.updateItem(newSketch, req.body, function (error) {
    res.locals.enquirySubmitted = true;
    if (error) res.locals.saveError = true;
    res.render('addSketch');
  });
};