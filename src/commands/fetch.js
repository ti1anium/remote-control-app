/*
    fetch.js
    this command should look for all active and saved devices and display
    only those devices that are paired with user's computer
*/

const { TerminalCommand } = require('../lib/command.js');

module.exports = new TerminalCommand (
    "fetch",
    "looks for available devices",
    [],
    async () => {
        
    }
);