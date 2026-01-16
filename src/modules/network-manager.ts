import * as dgram from "dgram";
import * as os from "os";
import EventEmitter from "events";
import { buffer } from "stream/consumers";

type NetworkPacket = {
	senderMAC: string;
	senderName: string;
	targetMAC: string | null;
	packetType: "fetch" | "pair" | "unpair" | "action";
	action: "shutdown" | "reboot" | "hibernate" | null;
	active: boolean;
};

const BROADCAST_PORT = 40000;
const WAKE_PORT = 9;

function getBroadcastAddress(): string {
	const nets = os.networkInterfaces();
	for (const name of Object.keys(nets)) {
		for (const net of nets[name] || []) {
			if (net.family === "IPv4" && !net.internal) {
				const parts = net.address.split(".");
				parts[3] = "255";
				return parts.join(".");
			}
		}
	}
	return "255.255.255.255";
}

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

function makeMagicPacket(mac: string): Buffer {
	const macBytes =
		mac
			.replace(/[:-]/g, "")
			.match(/.{2}/g)
			?.map((b) => parseInt(b, 16)) ?? [];

	const packet = Buffer.alloc(6 + 16 * 6, 0xff);

	for (let i = 6; i < packet.length; i += 6) {
		for (let j = 0; j < 6; j++) {
			packet[i + j] = macBytes[j];
		}
	}

	return packet;
}

function broadcastPacket(socket: dgram.Socket, packet: NetworkPacket) {
	const buffer = Buffer.from(JSON.stringify(packet), "utf-8");

	console.log("sending: ", packet);

	socket.send(buffer, BROADCAST_PORT, getBroadcastAddress(), (e) => {
		if (e) {
			console.log("Broadcast error: " + e);
		}
	});
}

function directPacket(
	socket: dgram.Socket,
	address: string,
	packet: NetworkPacket,
) {
	const buffer = Buffer.from(JSON.stringify(packet), "utf-8");

	socket.send(buffer, BROADCAST_PORT, address, (e) => {
		if (e) {
			console.log("Direct error: " + e);
		}
	});
}

function broadcastWakePacket(socket: dgram.Socket, MAC: string) {
	const buffer = makeMagicPacket(MAC);

	socket.send(buffer, WAKE_PORT, getBroadcastAddress(), (e) => {
		if (e) {
			console.log("Wake packet broadcast error: " + e);
		}
	});
}

function createBroadcastListener(socket: dgram.Socket): EventEmitter {
	const emitter = new EventEmitter();

	socket.on("message", (msg, rinfo) => {
		try {
			const str = msg.toString("utf-8");
			const data = JSON.parse(str) as NetworkPacket;

			if (!data.packetType) return;
			if (data.senderMAC === getMAC()) return;

			console.log("received: ", data);

			emitter.emit(data.packetType, data, rinfo);
		} catch (e) {
			console.log("Packet processing error: " + e);
		}
	});

	return emitter;
}

export {
	BROADCAST_PORT,
	WAKE_PORT,
	getBroadcastAddress,
	getMAC,
	broadcastPacket,
	broadcastWakePacket,
	createBroadcastListener,
	NetworkPacket,
};
