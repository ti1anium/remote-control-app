const { createInterface } = require('readline');
const { requireAllCommands } = require('./lib/command.js');

const commands = requireAllCommands();

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