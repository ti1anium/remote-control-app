import { info } from 'console';
import * as dgram from 'dgram';
import * as os from 'os';
import EventEmitter from 'events';
import { buffer } from 'stream/consumers';

type NetworkPacket = {
    senderMAC: string,
    senderName: string,
    targetMAC: string | null,
    packetType: 'fetch' | 'pair' | 'unpair'
}

const BROADCAST_PORT = 9;
const BROADCAST_ADDRESS = '255.255.255.255';

function getMAC(): string {
    const interfaces = os.networkInterfaces();

    for (const [name, infos] of Object.entries(interfaces)) {
        if (infos) {
            for (const info of infos) {
                if (!info.internal) {
                    return info.mac;
                }
            }
        }
    }

    return "00:00:00:00:00:00";
}

function createSocket(): dgram.Socket {
    const socket = dgram.createSocket('udp4');

    socket.bind(BROADCAST_PORT, () => {
        socket.setBroadcast(true);
    });
    
    return socket;
}

function makeMagicPacket(mac: string): Buffer {
    const macBytes = mac
        .replace(/[:-]/g, "")
        .match(/.{2}/g)
        ?.map(b => parseInt(b, 16)) ?? [];

    const packet = Buffer.alloc(6 + 16 * 6, 0xFF);

    for (let i = 6; i < packet.length; i += 6) {
        for (let j = 0; j < 6; j++) {
            packet[i + j] = macBytes[j];
        }
    }

    return packet;
}

function broadcastPacket(socket: dgram.Socket, packet: NetworkPacket) {
    const buffer = Buffer.from(
        JSON.stringify(packet)
    );

    socket.send(buffer, BROADCAST_PORT, BROADCAST_ADDRESS, (e) => {
        if (e) {
            console.log(e);
        }
    });
}

function broadcastWakePacket(socket: dgram.Socket, MAC: string) {
    const buffer = makeMagicPacket(MAC);

    socket.send(buffer, BROADCAST_PORT, BROADCAST_ADDRESS, (e) => {
        if (e) {
            console.log(e);
        }
    });
}

function createBroadcastListener (socket: dgram.Socket): EventEmitter {
    const emitter = new EventEmitter();

    socket.on('message', (msg, rinfo) => {
        
    })

    return emitter;
}

export {
    BROADCAST_PORT,
    BROADCAST_ADDRESS,
    createSocket,
    getMAC,
    broadcastPacket,
    broadcastWakePacket,
    createBroadcastListener
}