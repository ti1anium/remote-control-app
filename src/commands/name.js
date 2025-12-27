/*
    name.js
    this command should change user's device name in the network
*/

const { TerminalCommand } = require('../lib/command.js');

module.exports = new TerminalCommand (
    "name",
    "shows or changes device name",
    ["device-name"],
    async () => {
        
    }
);