module.exports = RED => {
    const mustache = require("mustache");

    function FormatterNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on("input", msg => {
            let input = msg.payload;

            // wrap payload in object
            if (typeof msg.payload != "object") {
                input = { "value": msg.payload };
            }

            msg.payload = {
                "value": mustache.render(config.template, input)
            };
            node.send(msg);
        });
    }
    RED.nodes.registerType("Formatter", FormatterNode);
}