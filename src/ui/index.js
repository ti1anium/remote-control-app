const listeningContainer = document.getElementById("listening-devices-list");
const pairedContainer = document.getElementById("paired-devices-list");
const foundContainer = document.getElementById("found-devices-list");

function doAction (MAC, action) {

}

function createPair (MAC) {

}

function breakPair (MAC) {

}

function createDeviceElement (deviceName, deviceMAC, deviceState, isParent, isChild) {
    const main = document.createElement('div');

    main.innerHTML = `
        <div>
            <p class="primary-label">${deviceName}</p>
            <p class="secondary-label">MAC: ${deviceMAC}</p>
        </div>
        <div>
            <p class="state-label ${deviceState}">${deviceState}</p>
            <button>${isParent ? "Break Pair" : "Make as a parent node"}</button>
        </div>
        <div style="justify-content: end; display: ${isChild ? "flex" : "none"}">
            <button>Wake</button>
            <button>Shutdown</button>
            <button>Reboot</button>
            <button>Hibernate</button>
        </div>
    `;

    main.className = "device";

    return main;
}

window.electronAPI.onUpdateData((devices) => {
    foundContainer.innerHTML = '';

    for (let i = 0; i < devices.length; i++) {
        let element = createDeviceElement(
            devices[i].deviceName,
            devices[i].deviceMAC,
            devices[i].active ? "online" : "offline",
            devices[i].isParentNode,
            devices[i].isChildNode
        );

        foundContainer.appendChild(element);
    }
});