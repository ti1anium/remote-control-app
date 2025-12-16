const dgram = require('dgram');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createConfigFile, parseConfigFile } = require('./lib/config-manager');

app.on('ready', () => {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    createConfigFile();

    window.loadFile(path.join(__dirname, 'ui', 'index.html'));
});

/*const dgram = require('node:dgram');
const createMagicPacket = require('./lib/magic-packet');

const socket = dgram.createSocket('udp4');

const broadcastIp = '255.255.255.255';
const MAC = 'C8:7F:54:A0:D5:8D';
const broadcastPort = 9;

socket.bind(broadcastPort, () => {
    socket.setBroadcast(true);
});

socket.on('error', (errorMessage) => {
    console.log(errorMessage);
    socket.close();
});

socket.send(createMagicPacket(MAC), broadcastPort, broadcastIp, (error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Broadcast successful");
    }
});*/