const config = require('node-red-contrib-base/config');
const socket = require("socket.io-client")(config.serverUrl, { extraHeaders: { "serviceName": `[${config.nodeRedPort}] ${config.serviceName}` } });

socket.on("connection", () => {
    console.log(`Socket connected to ${config.serverUrl}:${config.nodeRedPort}`);
});

socket.on("disconnect", () => {
    console.log(`Socket disconnected from ${config.serverUrl}:${config.nodeRedPort}`);
});

module.exports.socket = socket;
