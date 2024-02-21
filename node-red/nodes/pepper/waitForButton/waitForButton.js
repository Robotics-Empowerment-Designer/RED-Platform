module.exports = RED => {
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    const events = new EventPubSub();

    let timeoutId = null;

    function getMapping(node) {
        const mapping = {
            "Head": RED._(node.type + ".buttons.head"),
            "LHand/Touch/Back": RED._(node.type + ".buttons.leftHand"),
            "RHand/Touch/Back": RED._(node.type + ".buttons.rightHand"),
            "Bumper/FrontLeft": RED._(node.type + ".buttons.leftBumper"),
            "Bumper/FrontRight": RED._(node.type + ".buttons.rightBumper"),
            "Bumper/Back": RED._(node.type + ".buttons.backBumper")
        };

        // remove (***) from each entry
        Object.keys(mapping).forEach(m => {
            if (mapping[m].includes("(")) {
                mapping[m] = mapping[m].split("(")[0].trim();
            }
        });

        return mapping;
    }

    function timeoutHandler(node, config) {
        if (node.waitingNode !== null) {
            const output = new Array(config.buttons.length + 1).fill(null);
            node.waitingNode.payload = RED._(node.type + ".timeout");
            output[config.buttons.length] = node.waitingNode;

            node.status({});
            node.send(output);
            node.waitingNode = null;
        }
        timeoutId = null;
    }

    function WaitForButton(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const mapping = getMapping(node);
        node.path = "/robot/wait/button";
        node.waitingNode = null;

        const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => {
            node.waitingNode = msg;

            if (config.buttons.length === 1)
                node.status({ fill: "blue", shape: "dot", text: RED._(node.type + ".waiting").replace("{}", mapping[config.buttons[0]]) });
            else
                node.status({ fill: "blue", shape: "dot", text: node.type + ".waitingMultiple" });

            if (config.timeout !== null && config.timeout > 0 && timeoutId === null) { // timeout === null prevents multiple/non-cancellable timeouts
                node.timeoutDuration = config.timeout * 1000;
                timeoutId = setTimeout(timeoutHandler, node.timeoutDuration, node, config)[Symbol.toPrimitive](); // we don't want to use the node.js setTimeout version (returns object), we only want the ID;
            }

            ch.emit(config.buttons);
        });

        ch.socket.on("event/touched", button => {
            if (!node.waitingNode || !config.buttons.includes(button)) {
                return;
            }

            clearTimeout(timeoutId);
            timeoutId = null;

            const output = new Array(config.buttons.length).fill(null);
            const index = config.buttons.indexOf(button);

            node.waitingNode.payload = mapping[button];
            output[index] = node.waitingNode;

            node.send(output);
            node.waitingNode = null;
            node.status({});
        })

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            clearTimeout(timeoutId);
            node.waitingNode = null;
            timeoutId = null;
            node.status({});
        });
    }
    RED.nodes.registerType("Wait for button", WaitForButton);
}