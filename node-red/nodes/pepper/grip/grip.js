module.exports = RED => {
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    const events = new EventPubSub();

    function ActivateGrip(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        if(config.movement=="Close") {
            node.path = "/robot/motion/hand_close";
        } else {
                node.path = "/robot/motion/hand_open";
            }

        let waitingNode = null;
        const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => {
            waitingNode = msg;
            node.status({ fill: "blue", shape: "dot", text: node.type + ".moving" });
            ch.emit(config.hand)
        });

        if(config.movement=="Close") {
            ch.socket.on("/motion/hand/close/finished", () => {
                if (!waitingNode) {
                    return;
                }
    
                node.send(waitingNode);
                waitingNode = null;
    
                node.status({});
            });
        } else {
                ch.socket.on("/motion/hand/open/finished", () => {
                    if (!waitingNode) {
                        return;
                    }
        
                    node.send(waitingNode);
                    waitingNode = null;
        
                    node.status({});
                });
            }

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            waitingNode = null;
            node.status({});
        });

    }
    RED.nodes.registerType("Grip", ActivateGrip);
}