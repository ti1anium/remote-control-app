function createBroadcastPacket (MAC, deviceName) {
    const dataObject = {
        PacketType: "broadcast",
        MAC: MAC,
        DeviceName: deviceName
    };

    const jsonString = JSON.stringify(dataObject);

    const packet = Buffer.from(jsonString, 'utf8');

    return packet;
}

function createActionPacket (MAC, targetMAC, action) {
    const dataObject = {
        PacketType: "action",
        MAC: MAC,
        Target: targetMAC,
        Action: action
    };

    const jsonString = JSON.stringify(dataObject);

    const packet = Buffer.from(jsonString, 'utf8');

    return packet;
}

function extractData (packet) {
    const jsonString = packet.toString('utf8');

    const dataObject = JSON.parse(jsonString);

    return dataObject;
}

module.exports = { createActionPacket, createBroadcastPacket, extractData }