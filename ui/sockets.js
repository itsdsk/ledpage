const net = require('net');
const WebSocket = require('ws');
const EventEmitter = require('events');

var exports = module.exports = {};

var connectFlag = true;
process.argv.forEach(function (val, index, array) {
    if (val == '--connect' || val == '-c') {
        connectFlag = true;
    } else if (val == '--no-connect' || val == '-n') {
        connectFlag = false;
    }
});

// backend inter-process communication
exports.backend = null;

exports.initialiseBackend = function () {
    if (exports.backend == null || exports.backend.readyState != 1) {
        exports.backend = new WebSocket('ws://localhost:9002');
    }
};

exports.initialiseBackend();

exports.backend.on('error', function (err) {
    console.log('backend WS not connected', err);
});

exports.backend.on('open', function () {
    console.log('backend WS connected');
});

// unix socket class
exports.DomainClient = class DomainClient {
    constructor(name) {
        // 
        this.name = name;
        //
        this.socketname = "/tmp/" + this.name + ".sock";
        //
        this.connected = false;
        this.socket = null;
        this.event = new EventEmitter();
        this.connectInterval = null;
        //
        if (connectFlag) this.startConnecting();
        //
        console.log("Constructing client " + this.name + " with path " + this.socketname);
    }

    startConnecting() {
        clearInterval(this.connectInterval);
        this.connectInterval = setInterval(this.connectToSocket.bind(this), 2500);
    }

    connectToSocket() {
        console.log("Connecting to " + this.name);
        this.socket = net.createConnection(this.socketname)
            .on('connect', () => {
                console.log("Connected to " + this.name);
                this.connected = true;
                clearInterval(this.connectInterval);
                console.log("... Connected to " + this.name);
            })
            .on('data', (data) => {
                console.log("Received data from " + this.name + ": " + data.toString());
                this.event.emit('data', data);
            })
            .on('end', () => {
                console.log(this.name + " ended communiction");
                this.connected = false;
                this.socket.end();
                this.startConnecting();
            })
            .on('close', () => {
                console.log(this.name + " communiction closed");
            })
            .on('error', (data) => {
                console.log("Error communicating with " + this.name + ": " + data);
                this.connected = false;
                this.socket.end();
                this.startConnecting();
            });
    }
};