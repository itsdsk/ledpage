var ipfsAPI = require('ipfs-api')

// connect to ipfs daemon API server
var ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'})


var startup = () => {
    ipfs.id(function (err, identity) {
        if (err) {
            console.log(err)
            setTimeout(function(){ startup(); }, 5000);
        } else {
            console.log("Identity:")
            console.log(identity)
        }
    })
}
startup()
