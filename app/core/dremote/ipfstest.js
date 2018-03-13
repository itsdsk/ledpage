var ipfsAPI = require('ipfs-api')

// connect to ipfs daemon API server
var ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'})


var topic

topic = 'resin-ipfs'

console.log("Communication topic: "+topic)

const receiveMsg = (msg) => {
    console.log(msg)
    data = msg.data.toString('utf8')
    console.log("Received data: '"+data+"'")
}

var startup = () => {
    ipfs.id(function (err, identity) {
        if (err) {
            console.log(err)
            setTimeout(function(){ startup(); }, 5000);
        } else {
            console.log("Identity:")
            console.log(identity)
            ipfs.pubsub.subscribe(topic, receiveMsg, (err) => {console.log('Could not subscribe..')})
            ipfs.pubsub.ls((err, topics) => {
                if (err) {
                    throw err
                }
                console.log("Subscribed topics:")
                console.log(topics)
            })
        }
    })
}
startup()

// Periodically show peers
setInterval(function(){
ipfs.pubsub.peers(topic, (err, peerIds) => {
  if (err) {
    throw err
  }
  console.log("Peers:")
  console.log(peerIds)
})
            ipfs.pubsub.ls((err, topics) => {
                if (err) {
                    throw err
                }
                console.log("Subscribed topics:")
                console.log(topics)
            })
// ipfs.pubsub.publish(topic, new Buffer('banana'), () => {})
}, 10000);

