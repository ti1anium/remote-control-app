const { TerminalCommand } = require('../lib/command.js');
const { svc } = require('../index.js');

module.exports = new TerminalCommand (
    "reload",
    "reloads background listener",
    [],
    async () => {
        console.log("Reloading background listener...");

        svc.exists(exists => {
            if (exists) {
                svc.uninstall();
            } else {
                console.log("Couldn't find background listener, installing...");
                svc.install();
            }
        });
    }
);