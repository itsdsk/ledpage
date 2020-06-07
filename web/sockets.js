const net = require('net');
const EventEmitter = require('events');

var exports = module.exports = {};

var connectFlag = true;
process.argv.forEach(function (val, index, array) {
    if (val == '--connect' || val == '-c') {
        connectFlag = true;
        console.log(`Connecting to backend and renderer`);
    } else if (val == '--no-connect' || val == '-n') {
        connectFlag = false;
        console.log(`Not connecting to backend and renderer`);
    }
});

// unix socket class
exports.DomainClient = class DomainClient {
    constructor(name) {
        // 
        this.name = name;
        //
        this.socketname = `/tmp/${this.name}.sock`;
        //
        this.connected = false;
        this.socket = null;
        this.event = new EventEmitter();
        this.connectInterval = null;
        //
        if (connectFlag) {
            console.log(`Constructing client ${this.name} with path ${this.socketname}`);
            this.startConnecting();
        }
    }

    startConnecting() {
        clearInterval(this.connectInterval);
        this.connectInterval = setInterval(this.connectToSocket.bind(this), 2500);
    }

    write(msg) {
        if (this.socket) {
            this.socket.write(msg);
        } else {
            if (connectFlag) {
                console.log(`Error sending msg to ${this.name}: socket is null`);
            }
        }
    }

    connectToSocket() {
        console.log(`Connecting to ${this.name}`);
        this.socket = net.createConnection(this.socketname)
            .on('connect', () => {
                this.connected = true;
                clearInterval(this.connectInterval);
                console.log(`Connected to ${this.name}`);
            })
            .on('data', (data) => {
                console.log(`Received data from ${this.name}`);
                this.event.emit('data', data);
            })
            .on('end', () => {
                console.log(`${this.name} ended communiction`);
                this.connected = false;
                this.socket.end();
                this.startConnecting();
            })
            .on('close', () => {
                console.log(`${this.name} communiction closed`);
            })
            .on('error', (data) => {
                console.log(`Error communicating with ${this.name}: ${data}`);
                this.connected = false;
                this.socket.end();
                this.startConnecting();
            });
    }
};