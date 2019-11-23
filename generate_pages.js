const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');


// read partials directory
fs.readdirSync(path.join(__dirname, `partials`)).forEach(file => {
    // read file
    fs.readFile(path.join(__dirname, `partials`, file), function (err, data) {
        if (err) throw err;
        // register partial
        console.log(`Registered partial: ${path.basename(file, `.hbs`)}`);
        Handlebars.registerPartial(path.basename(file, `.hbs`), data.toString());
    });
});

// read views directory
fs.readdir(path.join(__dirname, `views`), function (err, files) {
    if (err) throw err;
    files.forEach(file => {
        // read file
        fs.readFile(path.join(__dirname, `views`, file), function (err, data) {
            if (err) throw err;
            // compile page
            var compiler = Handlebars.compile(data.toString());
            // put name of page in object to be sent to template
            var page = {};
            page[path.basename(file, `.hbs`)] = true;
            var rendered = compiler(page);
            // save to file
            if (file.startsWith(`home`)) {
                fs.writeFile(path.join(__dirname, `public`, `index.html`), rendered, function (err) {
                    if (err) throw err;
                    console.log(`Generated view: ${path.basename(file, `.hbs`)}`);
                });
            } else {
                // check folder exists
                fs.mkdir(path.join(__dirname, `public`, path.basename(file, `.hbs`)), err => {
                    if (err && err.code != 'EEXIST') throw 'up';
                    fs.writeFile(path.join(__dirname, `public`, path.basename(file, `.hbs`), `index.html`), rendered, function (err) {
                        if (err) throw err;
                        console.log(`Generated view: ${path.basename(file, `.hbs`)}`);
                    });
                });
            }
        })
    })
})