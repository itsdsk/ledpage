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
        }, {
            'title': 'RGB Fade',
            'state': 'published',
            //'author': 'user@keystonejs.com',
            'localDir': 'sketch1',
        },
        {
            'title': 'Intensity Pulse',
            'state': 'published',
            //'author': 'user@keystonejs.com',
            'localDir': 'sketch2',
            'ipfsHash': 'QmaqNgz2fBVorb2rb4WF55fBq6Vymaenj5HT7oeMVJtJyS',
            'channels': 'sketches'
        },
        {
            'title': 'Decentralised',
            'state': 'published',
            //'author': 'user@keystonejs.com',
            'localDir': 'sketch3',
            'ipnsHash': 'QmZXWHxvnAPdX1PEc7dZHTSoycksUE7guLAih8z3b43UmU'
        }
    ],
};