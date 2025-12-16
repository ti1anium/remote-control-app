const main = document.getElementById('main');

function containsRestrictedCharacters (text) {
    const restrictedCharacters = "<>/";

    for (let i = 0; i < text.length; i++) {
        if (restrictedCharacters.includes(text.charAt(i))) {
            return true;
        }
    }

    return false;
}

function createDeviceElement (deviceName, ipAddress, MAC, state) {
    let element = document.createElement('div');

    element.className = "device";

    const states = ["Offline", "Online"];
    const labelClasses = ["error", "success"];

    const stateLabel = states[state];
    const stateLabelClass = labelClasses[state];

    if (containsRestrictedCharacters(deviceName))
        deviceName = "Device";

    if (containsRestrictedCharacters(ipAddress))
        ipAddress = "000.000.0.0";

    if (containsRestrictedCharacters(MAC))
        MAC = "00:00:00:00:00:00";

    element.innerHTML = `
        <div class="icon-container">
            <img src="res/device.png">
        </div>

        <div class="info">
            <p class="name">${deviceName}</p>
            <p class="address">IP: ${ipAddress}</p>
            <p class="mac">MAC: ${MAC}</p>
            <p class="state ${stateLabelClass}">${stateLabel}</p>
        </div>

        <div class="controls">
            <button>Wake</button>
            <button>Reboot</button>
            <button>Shutdown</button>
        </div>
    `;

    return element;
}

main.appendChild(createDeviceElement("test", "192.168.0.1", "AA:BB:CC:DD:EE:FF", 0));