module.exports = RED => {
    const nodeRedPort = require('node-red-contrib-base/config').nodeRedPort;
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    const events = new EventPubSub();

    function RunMovement(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/navigation/to";
        node.status({});

        let waitingNode = null;
        let output = new Array(config.output).fill(null);

        const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => {
            waitingNode = msg;
            node.status({ fill: "blue", shape: "dot", text: node.type + ".moving" });

            ch.emit([config.posX, config.posY]);
        });

        ch.socket.on("/event/navigation/finished", success => {
            if (!waitingNode) {
                return;
            }

            if(success) {
                output[0] = waitingNode;
            } else {
                output[1] = waitingNode;

                node.status({ fill: "red", shape: "dot", text: node.type + ".movingInterrupted" });

                setTimeout(() => {
                    node.status({});
                }, 5000);
            }

            node.send(output);
            waitingNode = null;
            output = new Array(config.output).fill(null);
            node.status({});
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            waitingNode = null;
            node.status({});
        });
    }
    RED.nodes.registerType("Move", RunMovement);
}