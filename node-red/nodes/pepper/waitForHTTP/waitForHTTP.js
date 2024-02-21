module.exports = RED => {
    const socket = require("../connection").socket;
    const EventPubSub = require('node-red-contrib-base/eventPubSub')

    const events = new EventPubSub();

    const waitNodeList = [];

    RED.httpAdmin.get("/wait-for-http", RED.auth.needsPermission("inject.write"), async (req, res) => {
        waitNodeList.forEach(node => {
            if(node.waitingNode !== null) {
                node.send(node.waitingNode);
                resetNodeState(node);
            }
            
        });
        res.end("OK");
    });

    function resetNodeState(node) {
        waitingNode = null;
        node.status({});

        // clean up node list
    }

    function WaitForHTTP(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/external/HTTP";
        node.waitingNode = null;
        waitNodeList.push(node);

        // const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => {
            node.waitingNode = msg;
            node.status({ fill: "blue", shape: "dot", text: node.type + ".waiting" });

            // wait some time to prevent a race condition with _set_awareness
            // node.timeout = setTimeout(() => {
            //     ch.emit();
            // }, 250);
        });

        node.on("close", (removed, done) => {
            waitNodeList.filter(item => item !== node.id);
            resetNodeState(node);
            done();
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            resetNodeState(node);
        });
    }
    RED.nodes.registerType("Wait for HTTP", WaitForHTTP);
}