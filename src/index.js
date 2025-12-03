const { app, BrowserWindow } = require('electron');
const path = require('path');

app.on('ready', () => {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false
    });

    window.loadFile(path.join(__dirname, 'ui', 'index.html'));
})