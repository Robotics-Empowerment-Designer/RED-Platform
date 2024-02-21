module.exports = RED => {
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    const events = new EventPubSub();

    function WaitNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on("input", msg => {
            node.status({ fill: "blue", shape: "dot", text: node.type + ".waiting" });

            node.timeout = setTimeout(() => {
                node.send(msg);

                node.status({});
            }, config.time * 1000);
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            clearTimeout(node.timeout);
            node.status({});
        });
    }
    RED.nodes.registerType("Wait time", WaitNode);
}