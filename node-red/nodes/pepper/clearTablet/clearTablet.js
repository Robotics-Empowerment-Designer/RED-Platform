module.exports = RED => {
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");

    function ClearTabletNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/tablet/clear";

        const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => {
            ch.emit();

            if (socket.connected) {
                node.send(msg);
            }
        });
    }
    RED.nodes.registerType("Clear tablet", ClearTabletNode);
}