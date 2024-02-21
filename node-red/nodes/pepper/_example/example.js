module.exports = RED => {
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require("../eventPubSub");

    const events = new EventPubSub(); // boilerplate event publish subscribe object to listen to specific events, important especially for the user stop event to clean up the state of the node

    function ExampleNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/example"; // eventname that our webserver listens to (not implement in this case)

        let waitingNode = null;
        const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => { // this will get triggered when a node of this type enters it's activated state (i.e. gets a message from the previous node) 
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

            waitingNode = msg; // we use this as flag so only this specific node instance will act on the tts/finished event
            node.status({ fill: "blue", shape: "dot", text: node.type + ".exampleString" }); // inform the user that your node is currently active and (brief) what it is doing 
            // note that the text is localized as well
            ch.emit([text, config.time]); // emit Socket.IO event
        });

        ch.socket.on("/event/example/finished", () => { // our server needs emit an event with this name when the robot finished his action
            if (!waitingNode) { // the flag mentioned in line 30
                return;
            }

            // Here you should also reset/stop long-running actions

            node.send(waitingNode); // continue to the next node
            waitingNode = null;

            node.status({});
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => { // run when the user clicks the stop button on the stop node
            clearTimeout(node.timeout);
            node.status({});
        });
    }
    RED.nodes.registerType("Example", ExampleNode);
}