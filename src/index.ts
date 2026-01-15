import { BrowserWindow, app, ipcMain, Menu, Tray, nativeImage } from 'electron';
import * as os from 'os';
import * as path from 'path';

import * as configManager from './modules/config-manager';
import * as networkManager from './modules/network-manager';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

app.on('ready', () => {
    function createWindow() {
        if (!mainWindow) {
            mainWindow = new BrowserWindow({
                minWidth: 600,
                minHeight: 400,

                width: 800,
                height: 600,

                autoHideMenuBar: true,

                webPreferences: {
                    preload: path.join(__dirname, "preload.js")
                }
            });

            mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

            mainWindow.on('close', (event) => {
                if (!isQuitting) {
                    event.preventDefault();

                    if (mainWindow) {
                        mainWindow.hide();
                    }
                }

                return false;
            });
        }

        mainWindow.show();
    }

    app.on('before-quit', () => {
        isQuitting = true;
    });

    let iconPath: string;
    if (os.platform() === 'win32') {
        iconPath = path.join(__dirname, 'res', 'icon.ico');
    } else {
        iconPath = path.join(__dirname, 'res', 'icon.png');
    }

    const icon = nativeImage.createFromPath(iconPath);

    tray = new Tray(icon);

    tray.setToolTip("App for remote start up / shutdown");

    tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: "Open App", click: createWindow
        },
        { type: 'separator' },
        {
            label: "Quit", click: () => {
                app.quit();
            }
        }
    ]));

    tray.on('click', createWindow);

    configManager.getOrCreateConfigFile();

    ipcMain.on("create-pair", (_, MAC: string) => {

    });

    ipcMain.on("break-pair", (_, MAC: string) => {

    });

    ipcMain.on("do-action", (_, MAC: string, action: string) => {

    });
});