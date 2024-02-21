module.exports = RED => {
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub')

    const events = new EventPubSub();

    function SayNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/tts/say";

        let waitingNode = null;
        const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => {
            // use injected value
            let text = msg.payload;

            // use injected value from payload
            if (typeof msg.payload == "object" && "value" in msg.payload) {
                text = msg.payload.value;
            }

            // if node property input is not empty, use user input instead
            if (config.text !== "") {
                text = config.text;
            }

            waitingNode = msg;
            node.status({ fill: "blue", shape: "dot", text: node.type + ".saying" });

            ch.emit([text, config.language, config.isAnimated]);
        });

        ch.socket.on("/event/tts/finished", () => {
            if (!waitingNode) {
                return;
            }

            node.send(waitingNode);
            waitingNode = null;

            node.status({});
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            waitingNode = null;
            node.status({});
        });
    }
    RED.nodes.registerType("Say", SayNode);
}