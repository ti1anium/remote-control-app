function createPacket (type, MAC, deviceName) {
    const dataObject = {
        PacketType: type,
        MAC: MAC,
        DeviceName: deviceName
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

module.exports = { createPacket, extractData }