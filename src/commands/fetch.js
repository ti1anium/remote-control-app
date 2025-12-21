const { TerminalCommand } = require('../lib/command.js');
const { socket, broadcastAdress } = require('../index.js');
const { createPacket, extractData } = require('../lib/packet.js');

const broadcastPort = 9;

module.exports = new TerminalCommand (
    "fetch",
    "looks for available devices",
    [],
    async () => {
        const packet = createPacket("fetch");

        socket.send(packet, 9, broadcastAdress, (e) => {
            if (e) {
                console.log("Error sending fetch packet: " + e);
            }
        });

        const devices = [];

        socket.addListener('message', (msg, rinfo) => {
            const data = extractData(msg);

            if (data["PacketType"] === "response") {
                devices.push({
                    IP: rinfo.address,
                    MAC: data["MAC"],
                    DeviceName: data["DeviceName"] || "Unnamed"
                });
            }
        });

        await new Promise(r => setTimeout(r, 2500));

        socket.removeAllListeners('message');
    }
);