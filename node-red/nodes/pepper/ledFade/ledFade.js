module.exports = RED => {
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');
    let lastReset = 0;

    const events = new EventPubSub();

    function resetNodeState(ch) {
        if (lastReset + 100 > Date.now()) {
            return;
        }

        lastReset = Date.now();
        ch.emit(null, "/robot/led/reset");
    }

    function LEDFadeNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/led/fade";

        const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => {
            ch.emit([config.group, config.colorName, config.duration]);

            if (socket.connected) {
                node.send(msg);
            }
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            resetNodeState(ch);
        });
    }
    RED.nodes.registerType("Fade LED", LEDFadeNode);
}