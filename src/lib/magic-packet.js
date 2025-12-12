function createMagicPacket (MAC) {
    const macBytes = MAC
        .replace(/[:-]/g, "")
        .match(/.{2}/g)
        .map(b => parseInt(b, 16));

    const packet = Buffer.alloc(6 + 16 * 6, 0xFF);

    for (let i = 6; i < packet.length; i += 6) {
        for (let j = 0; j < 6; j++) {
            packet[i + j] = macBytes[j];
        }
    }

    return packet;
}

module.exports = createMagicPacket;