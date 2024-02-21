
module.exports = RED => {
    const nodeRedPort = require('node-red-contrib-base/config').nodeRedPort;
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    const events = new EventPubSub();

    function RunMovementAlong(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/navigation/along";
        node.status({});

        let waitingNode = null;
        const ch = new ConnectionHelper(socket, node);
        

        node.on("input", msg => {
            waitingNode = msg;
            node.status({ fill: "blue", shape: "dot", text: node.type + ".moving" });

            ch.emit([config.posX, config.posY, config.theta, config.time]);
        });

        ch.socket.on("/event/navigation/finished", success => {
            if (!waitingNode) {
                return;
            }

            if (!success) {
                node.status({ fill: "red", shape: "dot", text: node.type + ".movingInterrupted" });

                events.trigger(EventPubSub.STOP_EVENT_BUTTON_PRESSED, node.id);

                setTimeout(() => {
                    node.status({});
                }, 5000);

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
    RED.nodes.registerType("MoveAlong", RunMovementAlong);
}