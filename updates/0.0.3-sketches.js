var keystone = require('keystone');

exports.create = {
    SketchChannel: [{
        'name': 'sketches',
        __ref: 'sketches'
    }],
    Sketch: [{
            'title': 'wrqrffref',
            'state': 'published',
            //'author': 'user@keystonejs.com',
            'localDir': 'sketch0',
            'thumbnails': 'screenshot.png',
            'prefThumb': 'screenshot.png',
            'modifiedDate': '2018-01-01',
        }, {
            'title': 'RGB Fade',
            'state': 'published',
            //'author': 'user@keystonejs.com',
            'localDir': 'sketch1',
            'thumbnails': 'screenshot.png',
            'prefThumb': 'screenshot.png',
            'modifiedDate': '2018-01-02',
        },
        {
            'title': 'Intensity Pulse',
            'state': 'published',
            //'author': 'user@keystonejs.com',
            'localDir': 'sketch2',
            'ipfsHash': 'QmaqNgz2fBVorb2rb4WF55fBq6Vymaenj5HT7oeMVJtJyS',
            'channels': 'sketches',
            'thumbnails': 'screenshot.png',
            'prefThumb': 'screenshot.png',
            'modifiedDate': '2018-02-02',
        },
        {
            'title': 'Decentralised',
            'state': 'published',
            //'author': 'user@keystonejs.com',
            'localDir': 'sketch3',
            'thumbnails': 'screenshot.png',
            'prefThumb': 'screenshot.png',
            'ipnsHash': 'QmZXWHxvnAPdX1PEc7dZHTSoycksUE7guLAih8z3b43UmU',
            'modifiedDate': '2018-03-02',
        }
    ],
};