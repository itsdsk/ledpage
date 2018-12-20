const Handlebars = require('handlebars');
const fs = require('fs');

// compile media
var template;
fs.readFile(__dirname + "/template.handlebars", function (err, data) {
    if (err) throw err;
    template = Handlebars.compile(data.toString());
});

module.exports = {
    scanMedia: function () {
        var media = new Array();
        // look in each folder in content directory
        fs.readdirSync('./media').filter(function (file) {
            if (fs.statSync('./media/' + file).isDirectory()) {
                // load json
                var med = require('./media/' + file + '/demo.json');
                // parse image into json
                fs.readFile('./media/item1/thumb.jpg', function (err, buf) {
                    if (err) throw err;
                    var img = "data:image/jpeg;base64," + buf.toString('base64');
                    med.img_src = img;
                    media.push(med);
                });
            }
        });
        return media;
    },
    mediaObjectToHtml: function (item) {
        return template(item);
    }
};