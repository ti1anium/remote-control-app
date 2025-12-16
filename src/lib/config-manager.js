const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const configFilePath = path.join(__dirname, "../", "config.json");

const defaultConfigFileContent = {
    "broadcast-address": "255.255.255.255",
    "broadcast-port": 9,
    "parent-node": null,
    "child-nodes": []
};

function createConfigFile() {
    if (!fs.existsSync(configFilePath)) {
        fs.writeFileSync(configFilePath, JSON.stringify(defaultConfigFileContent), { encoding: 'utf-8' });
    }
}

function parseConfigFile() {
    if (fs.existsSync(configFilePath)) {
        const content = fs.readFileSync(configFilePath, { encoding: 'utf-8' });
        const parsedContent = JSON.parse(content);

        return parsedContent;
    }

    return {};
}

function writeConfigFile(parameter, value) {
    if (fs.existsSync(configFilePath)) {
        const content = parseConfigFile();

        content[parameter] = value;

        const textContent = JSON.stringify(content);

        fs.writeFileSync(configFilePath, textContent, { encoding: 'utf-8' });
    }
}

module.exports = { createConfigFile, parseConfigFile, writeConfigFile };