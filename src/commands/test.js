const { TerminalCommand } = require('../lib/command.js');

module.exports = new TerminalCommand (
    "test",
    "test function",
    ["text"],
    async (text) => {
        console.log("This is a test: " + text);
    }
);