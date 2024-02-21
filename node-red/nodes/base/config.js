const ip = process.env.PEPPER_REST_SERVER_IP || require("./IPHelper").ip;
const nodeRedPort = process.env.NODE_RED_PORT;
const flaskPort = process.env.PEPPER_REST_SERVER_PORT;

module.exports.nodeRedPort = nodeRedPort;
module.exports.serverUrl = `http://${ip}:${flaskPort}`;
module.exports.serviceName = "Node-RED";
