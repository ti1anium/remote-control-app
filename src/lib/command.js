const path = require('path');
const fs = require('fs');

class TerminalCommand {
    constructor (name, description, args, callback) {
        this.Name = name;
        this.Description = description;
        this.Args = args;
        this.Callback = callback;
    }

    async Execute(...params) {
        await this.Callback(...params);
    }
}

function requireAllCommands () {
    const commandsPath = path.join(__dirname, '..', "commands");

    const files = fs.readdirSync(commandsPath);
    const res = new Map();

    for (let file of files) {
        if (file.endsWith("js")) {
            const command = require(path.join(commandsPath, file));

            res.set(command.Name, command);
        }
    }

    return res;
}

module.exports = { TerminalCommand, requireAllCommands };