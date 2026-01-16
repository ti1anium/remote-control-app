import { BrowserWindow, app, ipcMain, Menu, Tray, nativeImage } from "electron";
import * as os from "os";
import * as path from "path";
import * as dgram from "dgram";

import * as configManager from "./modules/config-manager";
import * as networkManager from "./modules/network-manager";

type FoundDevice = {
	deviceMAC: string;
	deviceName: string;
	isChildNode: boolean;
	isParentNode: boolean;
	active: boolean;
	ipAddress: string | null;
};

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

const socket = dgram.createSocket("udp4");

app.on("ready", () => {
	let config = configManager.getOrCreateConfigFile();
	let allDevices: FoundDevice[] = [];

	function updateDevices() {
		for (let i = 0; i < config.childNodes.length; i++) {
			if (allDevices.findIndex((device) => device.deviceMAC === config.childNodes[i].MAC) === -1) {
				allDevices.push({
					deviceMAC: config.childNodes[i].MAC,
					deviceName: config.childNodes[i].name,
					active: false,
					ipAddress: null,
					isChildNode: true,
					isParentNode: false
				});
			}
		}

		for (let i = 0; i < config.parentNodes.length; i++) {
			if (allDevices.findIndex((device) => device.deviceMAC === config.parentNodes[i].MAC) === -1) {
				allDevices.push({
					deviceMAC: config.parentNodes[i].MAC,
					deviceName: config.parentNodes[i].name,
					active: false,
					ipAddress: null,
					isChildNode: false,
					isParentNode: true
				});
			}
		}

		if (mainWindow) {
			mainWindow.webContents.send('update-devices', allDevices);
		}
	}

	function createWindow() {
		if (!mainWindow) {
			mainWindow = new BrowserWindow({
				minWidth: 600,
				minHeight: 400,

				width: 800,
				height: 600,

				autoHideMenuBar: true,

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

			mainWindow.webContents.on('did-finish-load', updateDevices);
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

					app.quit();
				},
			},
		]),
	);

	tray.on("click", createWindow);

	ipcMain.on("create-pair", (_, MAC: string) => {});

	ipcMain.on("break-pair", (_, MAC: string) => {});

	ipcMain.on("do-action", (_, MAC: string, action: string) => {});

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
			} catch (e) {
				console.log("Pair packet processing error: " + e);
			}
		},
	);

	dataReceivedEvent.on(
		"unpair",
		(data: networkManager.NetworkPacket, rinfo: dgram.RemoteInfo) => {
			try {
			} catch (e) {
				console.log("Unpair packet processing error: " + e);
			}
		},
	);

	dataReceivedEvent.on(
		"action",
		(data: networkManager.NetworkPacket, rinfo: dgram.RemoteInfo) => {
			try {
			} catch (e) {
				console.log("Action packet processing error: " + e);
			}
		},
	);
	
	setInterval(() => {
		networkManager.broadcastPacket(socket, {
			packetType: "fetch",
			senderMAC: deviceMAC,
			senderName: config.deviceName,
			targetMAC: null,
			action: null,
			active: true,
		});
	}, 10000);
});
