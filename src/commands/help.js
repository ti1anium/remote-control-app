/*
    help.js
    this command should display all available commands
*/

const { TerminalCommand, requireAllCommands } = require('../lib/command.js');

module.exports = new TerminalCommand (
    "help",
    "shows all commands",
    [],
    async () => {
        const commands = requireAllCommands();
        
        commands.forEach((v) => {
            console.log(`-${v.Name} [${v.Args}] -- ${v.Description}`);
        });
    }
);