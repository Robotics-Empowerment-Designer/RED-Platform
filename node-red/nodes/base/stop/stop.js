module.exports = RED => {
    const EventPubSub = require("../eventPubSub");

    const events = new EventPubSub();

    RED.httpAdmin.post("/cancel-loop/:id", RED.auth.needsPermission("inject.write"), (req, res) => {
        // const node = RED.nodes.getNode(req.params.id); // Check for null
        res.end();

        events.trigger(EventPubSub.STOP_EVENT_BUTTON_PRESSED);
    });

    function StopNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on("input", msg => {
            events.trigger(EventPubSub.STOP_EVENT, node.id);
        });
    }
    RED.nodes.registerType("Stop", StopNode);
}