const dgram = require('dgram');
const packet = require('./packet.js');
const os = require('os');

// creates UDP socket to communitcate with other devices
let socket;
const broadcastPort = 9;
const broadcastAdress = '255.255.255.255';

// returns MAC address of currently used network card
function getMAC() {
    const interfaces = os.networkInterfaces();

    for (const [name, infos] of Object.entries(interfaces)) {
        for (const info of infos) {
            if (!info.internal) {
                return info.mac;
            }
        }
    }
}

function initialize() {
    socket = dgram.createSocket('udp4');

    socket.bind(broadcastPort, () => {
        socket.setBroadcast(true);
    });

    // listens to broadcast address to find new devices
    let devices = [];
    socket.on('message', (message, rinfo) => {

    })

    // broadcasts packet to other devices so they can find it
    setInterval(() => {
        const buffer = packet.createBroadcastPacket(socket)
    }, 5000);
}

function getDevices() {

}

module.exports = { getDevices, initialize, getMAC }