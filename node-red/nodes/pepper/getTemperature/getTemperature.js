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
        ch.emit(null, "/camera/stop");
    }

    function GetTemperature(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/camera/start";
        node.waitingNode = null;
        let startTime = 0;

        const ch = new ConnectionHelper(socket, node);
        let output = new Array(config.output).fill(null);

        node.on("input", msg => {
            node.waitingNode = msg;
            node.status({ fill: "blue", shape: "dot", text: node.type + ".waitingForValues" });

            // wait some time to prevent a race condition with _set_awareness
            node.timeout = setTimeout(() => {
                startTime = Date.now();

                ch.emit("false"); // start thermal camera messages
            }, 250);
        });

        ch.socket.on("/event/camera/temperature", temp => {
            if (!node.waitingNode) {
                return;
            }

            if (startTime + 2000 > Date.now()) {
                return;
            }

            node.waitingNode.payload = {
                "value": temp
            };

            if (config.tempThreshold < temp) {
                output[0] = node.waitingNode;
            } else {
                output[1] = node.waitingNode;
            }

            node.status({ fill: "gray", shape: "dot", text: RED._(node.type + ".lastTemp").replace("{}", temp) });
            node.send(output);

            // reset state
            node.waitingNode = null;
            output = new Array(config.output).fill(null);

            resetNodeState(ch); // stop thermal camera messages
        });

        node.on("close", (removed, done) => {
            resetNodeState(ch);
            done();
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            resetNodeState(ch);
            waitingNode = null;
            node.status({});
        });
    }
    RED.nodes.registerType("Get skin temperature", GetTemperature);
}