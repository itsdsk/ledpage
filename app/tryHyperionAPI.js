const net = require('net');

var colorCommand = {
  command: "color",
  priority: 100,
  duration: 360,
  color: [255, 0, 0]
};


const string = JSON.stringify(colorCommand) + "\n";


var client = new net.Socket();
client.connect(19444, 'localhost', function() {
	console.log('Connected');
	client.write(string);
});

client.on('data', function(data) {
	console.log('Received: ' + data);
	client.destroy(); // kill client after server's response
});

client.on('close', function() {
	console.log('Connection closed');
});