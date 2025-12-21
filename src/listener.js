const { parseConfigFile } = require('./lib/config-manager.js')
const dgram = require('dgram');

const socket = dgram.createSocket('udp4');

const broadcastPort = 9;

socket.bind(broadcastPort);