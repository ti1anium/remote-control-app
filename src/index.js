/*const { app, BrowserWindow } = require('electron');
const path = require('path');

app.on('ready', () => {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        autoHideMenuBar: true
    });

    window.loadFile(path.join(__dirname, 'ui', 'index.html'));
});*/

const dgram = require('node:dgram');
const { buffer } = require('node:stream/consumers');

const socket = dgram.createSocket('udp4');

const broadcastIp = '255.255.255.255';
const MAC = 'C8:7F:54:A0:D5:8D';
const broadcastPort = 9;

socket.bind(() => {
    socket.setBroadcast(true);
});

function makeMagicPacket(mac) {
    const macBytes = mac
        .replace(/[:-]/g, "")
        .match(/.{2}/g)
        .map(b => parseInt(b, 16));

    const packet = Buffer.alloc(6 + 16 * 6, 0xFF);

    for (let i = 6; i < packet.length; i += 6) {
        for (let j = 0; j < 6; j++) {
            packet[i + j] = macBytes[j];
        }
    }

    return packet;
}

socket.on('error', (errorMessage) => {
    console.log(errorMessage);
    socket.close();
});

socket.send(makeMagicPacket(MAC), broadcastPort, broadcastIp, (error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Broadcast successful");
    }
});