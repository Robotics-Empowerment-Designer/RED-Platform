module.exports = RED => {
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    const events = new EventPubSub();

    function JoinNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.inputSet = 0;
        node.currentInput = [];

        node.on("input", msg => {
            if (!node.inputSet) {
                node.status({ fill: "red", shape: "dot", text: node.type + ".needStartNode" });
                return;
            }

            node.status({ fill: "blue", shape: "dot", text: node.type + ".waiting" });

            node.currentInput.push(msg);

            // check if more messages can be accepted in the queue
            if (node.currentInput.length < node.inputSet.size) {
                return;
            }

            let index;
            if (config.outputMessage === "first") {
                index = 0;
            } else {
                index = node.currentInput.length - 1;
            }

            node.send(node.currentInput[index]);
            node.status({});
        });

        events.subscribe(EventPubSub.UPDATE_JOIN_LUT, data => {
            node.inputSet = data[JSON.stringify(node.id)];
            node.currentInput = [];
            node.status({});
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            node.currentInput = [];
            node.status({});
        });
    }
    RED.nodes.registerType("Join", JoinNode);
}