const { TerminalCommand, requireAllCommands } = require('../lib/command.js');

module.exports = new TerminalCommand (
    "help",
    "shows all commands",
    [],
    async (text) => {
        const commands = requireAllCommands();
        
        commands.forEach((v) => {
            console.log(`-${v.Name} [${v.Args}] -- ${v.Description}`);
        });
    }
);