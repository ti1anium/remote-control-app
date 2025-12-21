const { createInterface } = require('readline');
const { requireAllCommands } = require('./lib/command.js');
const { Service } = require('node-windows');
const dgram = require('dgram');
const path = require('path');

const commands = requireAllCommands();

const svc = new Service({
    name: "RCA Listener",
    description: "Background worker for Remote Control App",
    script: path.join(__dirname, 'listener.js')
});

svc.on('install', () => {
  console.log('Background Service installed');
  svc.start();
});

svc.on('uninstall', () => {
  console.log('Background Service uninstalled');
  svc.install();
});

svc.on('alreadyinstalled', () => {
  console.log('Background Service already installed');
  svc.start();
});

svc.on('error', (err) => {
  console.error(err);
});

svc.exists((exists) => {
  if (exists) {
    console.log('Background Service exists, updating');
    svc.uninstall();
  } else {
    console.log('Background Service does not exist, installing');
    svc.install();
  }
});

const socket = dgram.createSocket('udp4');
const broadcastPort = 9;
const broadcastAdress = '255.255.255.255';

socket.bind(broadcastPort, () => {
  socket.setBroadcast(true);
})

module.exports = { svc, socket, broadcastAdress };

console.log("Type 'e' to exit");

function question() {
    const readInterface = createInterface({ input: process.stdin, output: process.stdout });

    readInterface.question('>>> ', (response) => {
        if (response === 'e') {
            readInterface.close();
            return;
        }

        const splittedString = response.split(' ');
        const commandName = splittedString[0];
        const args = splittedString.slice(1);

        if (commands.has(commandName)) {
            commands.get(commandName).Execute(args);
        } else {
            console.log("Wrong command");
        }

        readInterface.close();
        question();
    });
}

question();