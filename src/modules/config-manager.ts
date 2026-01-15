import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

type ConfigurationNode = {
    MAC: string,
    name: string
}

type DefaultConfiguration = {
    parentNodes: ConfigurationNode[],
    childNodes: ConfigurationNode[],
    deviceName: string
}

function getCurrentUser(): string {
  if (process.env.USER) {
    return process.env.USER;
  } else if (process.env.USERNAME) {
    return process.env.USERNAME;
  } else if (process.env.LOGNAME) {
    return process.env.LOGNAME;
  } else {
    try {
      return os.userInfo().username;
    } catch (e) {
      return 'Could not determine user';
    }
  }
}

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

const defaultConfig: DefaultConfiguration = {
    parentNodes: [],
    childNodes: [],
    deviceName: getCurrentUser()
};

function getOrCreateConfigFile (): DefaultConfiguration {
    if (!fs.existsSync(CONFIG_PATH)) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig), {
            encoding: 'utf-8'
        });

        return defaultConfig;
    }

    const str = fs.readFileSync(CONFIG_PATH, {
        encoding: 'utf-8'
    });

    return JSON.parse(str);
}

function appendChildNode (MAC: string, deviceName: string): DefaultConfiguration {
    let config = getOrCreateConfigFile();

    config.childNodes.push({
        MAC: MAC,
        name: deviceName
    });

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config), {
        encoding: 'utf-8'
    });

    return config;
}

function appendParentNode (MAC: string, deviceName: string): DefaultConfiguration {
    let config = getOrCreateConfigFile();

    config.parentNodes.push({
        MAC: MAC,
        name: deviceName
    });

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config), {
        encoding: 'utf-8'
    });

    return config;
}

function removeChildNode (MAC: string): DefaultConfiguration {
    let config = getOrCreateConfigFile();

    for (let i = 0; i < config.childNodes.length; i++) {
        if (config.childNodes[i].MAC === MAC) {
            const a = config.childNodes.slice(0, i);
            const b = config.childNodes.slice(i + 1);

            config.childNodes = [...a, ...b];

            break;
        }
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config), {
        encoding: 'utf-8'
    });

    return config;
}

function removeParentNode (MAC: string): DefaultConfiguration {
    let config = getOrCreateConfigFile();

    for (let i = 0; i < config.parentNodes.length; i++) {
        if (config.parentNodes[i].MAC === MAC) {
            const a = config.parentNodes.slice(0, i);
            const b = config.parentNodes.slice(i + 1);

            config.parentNodes = [...a, ...b];

            break;
        }
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config), {
        encoding: 'utf-8'
    });

    return config;
}

export { 
    CONFIG_PATH,
    getOrCreateConfigFile,
    appendChildNode,
    appendParentNode,
    removeChildNode,
    removeParentNode
}