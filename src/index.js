const { createInterface } = require('readline');
const { requireAllCommands } = require('./lib/command.js');
//const { Service } = require('node-windows');
const path = require('path');
const network = require('./lib/network.js');

// looks for all commands in commands folder
const commands = requireAllCommands();

// !!! Works only on Windows, Linux support must be implemented !!!
// sets up and updates Windows Service
// used to listen for parent node all time since pc start-up
/*const svc = new Service({
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
});*/

network.initialize();
network.getMAC();

console.log("Type 'e' to exit");

// create read interface to interact with application and to execute loaded commands
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