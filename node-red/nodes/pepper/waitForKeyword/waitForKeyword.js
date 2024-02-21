module.exports = RED => {
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    const events = new EventPubSub();

    let lastReset = 0;
    let timeoutId = null;

    function resetNodeState(ch, node) {
        if (lastReset + 100 > Date.now()) {
            return;
        }

        clearTimeout(timeoutId);
        timeoutId = null;
        node.waitingNode = null;

        lastReset = Date.now();
        ch.emit(null, "/robot/speech-recognition/stop");
    }

    function timeoutHandler(ch, node, config) {
        if (node.waitingNode !== null) {
            const output = new Array(config.keywords.length + 1).fill(null);
            node.waitingNode.payload = RED._(node.type + ".timeout");
            output[config.keywords.length] = node.waitingNode;

            node.status({});
            node.send(output);

            resetNodeState(ch, node);
        }
        timeoutId = null;
    }

    function WaitForKeyword(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/speech-recognition/start";
        node.waitingNode = null;

        const ch = new ConnectionHelper(socket, node);
        node.on("input", msg => {
            node.waitingNode = msg;
            node.status({ fill: "blue", shape: "dot", text: node.type + ".waiting" });

            if (config.timeout !== null && config.timeout > 0 && timeoutId === null) { // timeout === null prevents multiple/non-cancellable timeouts
                node.timeoutDuration = config.timeout * 1000;
                timeoutId = setTimeout(timeoutHandler, node.timeoutDuration, ch, node, config)[Symbol.toPrimitive](); // we don't want to use the node.js setTimeout version (returns object), we only want the ID;
            }

            ch.emit([config.keywords, config.detectionFailedInquires, config.language, config.threshold]);
        });

        ch.socket.on("/event/speech/recognized", keyword => {
            if (!node.waitingNode || !config.keywords.includes(keyword)) {
                return;
            }

            clearTimeout(timeoutId);
            timeoutId = null;

            const output = new Array(config.keywords.length).fill(null);
            const index = config.keywords.indexOf(keyword);

            output[index] = node.waitingNode;

            node.send(output);
            node.waitingNode = null;

            node.status({});
        });

        node.on("close", (removed, done) => {
            resetNodeState(ch, node);
            done();
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            resetNodeState(ch, node);
            node.status({});
        });
    }
    RED.nodes.registerType("Wait for keyword", WaitForKeyword);
}