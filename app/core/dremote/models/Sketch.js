var keystone = require('keystone');
var Types = keystone.Field.Types;

var Sketch = new keystone.List('Sketch');

Sketch.add({
  name: { type: String, required: true, initial: true },
  description: { type: Types.Html, wysiwyg: true },
  published: { type: Boolean },
  publishDate: { type: Types.Date, index: true },
});

Sketch.schema.virtual('canAccessKeystone').get(function () {
  return true;
});

Sketch.schema.pre('save', function (next) {
  let sketch = this;
  if (sketch.isModified('published') && sketch.published) {
    this.publishDate = Date.now();
  }
  return next();
});

Sketch.defaultColumns = 'displayName, email';
Sketch.register();