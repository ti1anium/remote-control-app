import { BrowserWindow, app, ipcMain, Menu, Tray, nativeImage, Notification } from "electron";
import * as os from "os";
import * as path from "path";
import * as dgram from "dgram";
import { exec } from "child_process";

import * as configManager from "./modules/config-manager";
import * as networkManager from "./modules/network-manager";

type FoundDevice = {
	deviceMAC: string;
	deviceName: string;
	isChildNode: boolean;
	isParentNode: boolean;
	active: boolean;
	ipAddress: string | null;
	lastCallbackTime: number;
};

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

app.on("ready", () => {
	let config = configManager.getOrCreateConfigFile();
	let allDevices: FoundDevice[] = [];

	function updateDevices() {
		for (let i = 0; i < config.childNodes.length; i++) {
			if (
				allDevices.findIndex(
					(device) => device.deviceMAC === config.childNodes[i].MAC,
				) === -1
			) {
				allDevices.push({
					deviceMAC: config.childNodes[i].MAC,
					deviceName: config.childNodes[i].name,
					active: false,
					ipAddress: null,
					isChildNode: true,
					isParentNode: false,
					lastCallbackTime: 0,
				});
			}
		}

		for (let i = 0; i < config.parentNodes.length; i++) {
			if (
				allDevices.findIndex(
					(device) => device.deviceMAC === config.parentNodes[i].MAC,
				) === -1
			) {
				allDevices.push({
					deviceMAC: config.parentNodes[i].MAC,
					deviceName: config.parentNodes[i].name,
					active: false,
					ipAddress: null,
					isChildNode: false,
					isParentNode: true,
					lastCallbackTime: 0,
				});
			}
		}

		for (let device of allDevices) {
			if (Math.floor(Date.now() / 1000) - device.lastCallbackTime >= 10) {
				device.active = false;
			}
		}

		while (true) {
			const i = allDevices.findIndex(
				(device) => !device.active && !device.isChildNode,
			);
			if (i === -1) break;

			let a = allDevices.slice(0, i);
			let b = allDevices.slice(i + 1);

			allDevices = [...a, ...b];
		}

		if (mainWindow) {
			mainWindow.webContents.send("update-devices", allDevices);
		}
	}

	function createWindow() {
		if (!mainWindow) {
			mainWindow = new BrowserWindow({
				minWidth: 600,
				minHeight: 400,

				width: 800,
				height: 600,

				autoHideMenuBar: false,

				webPreferences: {
					preload: path.join(__dirname, "preload.js"),
				},
			});

			mainWindow.loadFile(path.join(__dirname, "ui", "index.html"));

			mainWindow.on("close", (event) => {
				if (!isQuitting) {
					event.preventDefault();

					if (mainWindow) {
						mainWindow.hide();
					}
				}

				return false;
			});

			mainWindow.webContents.on("did-finish-load", updateDevices);
		}

		mainWindow.show();
	}

	app.on("before-quit", () => {
		isQuitting = true;
	});

	let iconPath: string;
	if (os.platform() === "win32") {
		iconPath = path.join(__dirname, "res", "Icon.ico");
	} else {
		iconPath = path.join(__dirname, "res", "Icon.png");
	}

	const icon = nativeImage.createFromPath(iconPath);

	tray = new Tray(icon);

	tray.setToolTip("App for remote start up / shutdown");

	tray.setContextMenu(
		Menu.buildFromTemplate([
			{
				label: "Open App",
				click: createWindow,
			},
			{ type: "separator" },
			{
				label: "Quit",
				click: () => {
					networkManager.broadcastPacket(socket, {
						packetType: "fetch",
						senderMAC: deviceMAC,
						senderName: config.deviceName,
						targetMAC: null,
						action: null,
						active: false,
					});

					isQuitting = true;

					app.quit();
				},
			},
		]),
	);

	tray.on("click", createWindow);

	ipcMain.on("create-pair", (_, MAC: string) => {
		const index = allDevices.findIndex((v) => v.deviceMAC === MAC);
		if (index === -1) return;

		const device = allDevices[index];
		if (!device.active || device.ipAddress == null || device.isParentNode)
			return;

		config = configManager.appendParentNode(
			device.deviceMAC,
			device.deviceName,
		);

		networkManager.directPacket(socket, device.ipAddress, {
			packetType: "pair",
			senderMAC: deviceMAC,
			senderName: config.deviceName,
			targetMAC: device.deviceMAC,
			action: null,
			active: true,
		});

		updateDevices();
	});

	ipcMain.on("break-pair", (_, MAC: string) => {
		const index = allDevices.findIndex((v) => v.deviceMAC === MAC);
		if (index === -1) return;

		const device = allDevices[index];
		if (!device.active || device.ipAddress == null || !device.isParentNode)
			return;

		config = configManager.removeParentNode(device.deviceMAC);

		networkManager.directPacket(socket, device.ipAddress, {
			packetType: "unpair",
			senderMAC: deviceMAC,
			senderName: config.deviceName,
			targetMAC: device.deviceMAC,
			action: null,
			active: true,
		});

		updateDevices();
	});

	ipcMain.on(
		"do-action",
		(_, MAC: string, action: networkManager.NetworkPacket["action"]) => {
			if (action == null) return;

			const index = allDevices.findIndex((v) => v.deviceMAC === MAC);
			if (index === -1) return;

			const device = allDevices[index];
			if (!device.isChildNode) return;

			if (action === "wake") {
				networkManager.broadcastWakePacket(socket, device.deviceMAC);

				return;
			}

			if (!device.active || device.ipAddress == null) return;

			networkManager.directPacket(socket, device.ipAddress, {
				packetType: "action",
				senderMAC: deviceMAC,
				senderName: config.deviceName,
				targetMAC: device.deviceMAC,
				action: action,
				active: true,
			});
		},
	);

	socket.bind(networkManager.BROADCAST_PORT, () => {
		socket.setBroadcast(true);
	});

	const deviceMAC = networkManager.getMAC();

	const dataReceivedEvent = networkManager.createBroadcastListener(socket);

	dataReceivedEvent.on(
		"fetch",
		(data: networkManager.NetworkPacket, rinfo: dgram.RemoteInfo) => {
			try {
				const deviceIndex = allDevices.findIndex(
					(device) => device.deviceMAC === data.senderMAC,
				);

				const newDeviceObject: FoundDevice = {
					deviceMAC: data.senderMAC,
					deviceName: data.senderName,
					ipAddress: rinfo.address,
					active: data.active,
					isChildNode:
						config.childNodes.findIndex(
							(node) => node.MAC === data.senderMAC,
						) !== -1,
					isParentNode:
						config.parentNodes.findIndex(
							(node) => node.MAC === data.senderMAC,
						) !== -1,
					lastCallbackTime: Math.floor(Date.now() / 1000)
				};

				if (deviceIndex === -1) {
					allDevices.push(newDeviceObject);
				} else {
					allDevices[deviceIndex] = newDeviceObject;
				}

				updateDevices();
			} catch (e) {
				console.log("Fetch packet processing error: " + e);
			}
		},
	);

	dataReceivedEvent.on(
		"pair",
		(data: networkManager.NetworkPacket, rinfo: dgram.RemoteInfo) => {
			try {
				const index = allDevices.findIndex(
					(v) => v.deviceMAC === data.senderMAC,
				);
				if (index === -1) return;

				const device = allDevices[index];
				if (device.isChildNode) return;

				config = configManager.appendChildNode(
					device.deviceMAC,
					device.deviceName,
				);

				updateDevices();
			} catch (e) {
				console.log("Pair packet processing error: " + e);
			}
		},
	);

	dataReceivedEvent.on(
		"unpair",
		(data: networkManager.NetworkPacket, rinfo: dgram.RemoteInfo) => {
			try {
				const index = allDevices.findIndex(
					(v) => v.deviceMAC === data.senderMAC,
				);
				if (index === -1) return;

				const device = allDevices[index];
				if (!device.isChildNode) return;

				config = configManager.removeChildNode(device.deviceMAC);

				updateDevices();
			} catch (e) {
				console.log("Unpair packet processing error: " + e);
			}
		},
	);

	dataReceivedEvent.on(
		"action",
		(data: networkManager.NetworkPacket, rinfo: dgram.RemoteInfo) => {
			try {
				const index = allDevices.findIndex(
					(v) => v.deviceMAC === data.senderMAC,
				);
				if (index === -1) return;

				const device = allDevices[index];
				if (!device.isParentNode) return;

				let command: string | null = null;

				switch (data.action) {
					case "shutdown":
						switch (os.platform()) {
							case "linux":
							case "darwin":
								command = "shutdown -h now";
								break;
							case "win32":
								command = "shutdown /s /t 00";
								break;
							default:
								console.log("Unsupported OS for this command");
								return;
						}
						break;
					case "reboot":
						switch (os.platform()) {
							case "linux":
							case "darwin":
								command = "/sbin/reboot";
								break;
							case "win32":
								command = "shutdown /r /t 00";
								break;
							default:
								console.log("Unsupported OS for this command");
								return;
						}
						break;
					case "hibernate":
						switch (os.platform()) {
							case "linux":
								command = "systemctl hibernate"
								break;
							case "darwin":
								command = "pmset sleepnow";
								break;
							case "win32":
								command = "shutdown /h";
								break;
							default:
								console.log("Unsupported OS for this command");
								return;
						}
						break;
					default:
						console.log("Received unexpected command: ", data);
						return;
				}

				if (!command) return;

				exec(command, (error, stdout, stderr) => {
					if (error) {
						console.error(`exec error: ${error}`);
						return;
					}
					console.log(`stdout: ${stdout}`);
					console.error(`stderr: ${stderr}`);
				});
			} catch (e) {
				console.log("Action packet processing error: " + e);
			}
		},
	);

	console.log("Broadcast IP: ", networkManager.getBroadcastAddress());

	networkManager.broadcastPacket(socket, {
		packetType: "fetch",
		senderMAC: deviceMAC,
		senderName: config.deviceName,
		targetMAC: null,
		action: null,
		active: true,
	});

	setInterval(() => {
		networkManager.broadcastPacket(socket, {
			packetType: "fetch",
			senderMAC: deviceMAC,
			senderName: config.deviceName,
			targetMAC: null,
			action: null,
			active: true,
		});

		setTimeout(() => {
			updateDevices();
		}, 1000);
	}, 5000);

	const notification = new Notification ({
		title: "App is closed but works in background",
		body: "Right click the tray icon for options",
		icon: icon
	});

	notification.show();
});