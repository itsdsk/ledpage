const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// compile media
var template;
fs.readFile(__dirname + "/template.handlebars", function (err, data) {
    if (err) throw err;
    template = Handlebars.compile(data.toString());
});
var mediaPathRoot = './media';
module.exports = {
    scanMedia: function () {
        var media = new Array();
        // look in each folder in content directory
        fs.readdirSync(mediaPathRoot).filter(function (mediaPath) {
            if (fs.statSync(path.join(mediaPathRoot, mediaPath)).isDirectory()) {
                // load json
                var meta = require(path.join(__dirname, mediaPathRoot, mediaPath, 'demo.json'));
                meta.directory = mediaPath;
                // load files
                meta.files = new Array();
                (meta.demo.files).forEach(filename => {
                    fs.readFile(path.join(__dirname, mediaPathRoot, mediaPath, filename), 'utf8', function (err, buf) {
                        if (err) throw err;
                        var fileData = {
                            name: filename,
                            text: buf
                        };
                        meta.files.push(fileData);
                        //console.log(meta);
                        //media.push(meta);
                    });
                });
                // parse image into json
                fs.readFile('./media/item1/thumb.jpg', function (err, buf) {
                    if (err) throw err;
                    meta.img_src = "data:image/jpeg;base64," + buf.toString('base64');
                    //media.push(meta);
                });
                // add item to array
                media.push(meta);
            }
        });
        return media;
    },
    mediaObjectToHtml: function (item) {
        return template(item);
    },
    updateFile: function (demoDir, filename, content) {
        var filePath = path.join(__dirname, mediaPathRoot, demoDir, filename);
        fs.writeFile(filePath, content, function (err) {
            if (err) console.log(err);
            console.log('saved ' + filePath);
        });
    }
};