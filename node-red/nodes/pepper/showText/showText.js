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
        ch.emit(null, "/robot/tablet/clear");
    }

    function ShowTextNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/tablet/text";

        const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => {
            // injected value
            let text = msg.payload;

            // use injected value from payload
            if (typeof msg.payload == "object" && "value" in msg.payload) {
                text = msg.payload.value;
            }

            // if node property input is not empty, use user input instead
            if (config.text !== "") {
                text = config.text;
            }

            if (text == undefined) {
                text = "";
            }

            text = text.trim().split("\r\n");
            ch.emit(text);

            if (socket.connected) {
                node.send(msg);
            }
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            resetNodeState(ch);
        });
    }
    RED.nodes.registerType("Show text", ShowTextNode);
}