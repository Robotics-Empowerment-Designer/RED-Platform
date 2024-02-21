module.exports = RED => {
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');
    const got = require("got");
    let lastReset = 0;

    const urlCache = {};
    const events = new EventPubSub();

    function resetNodeState(ch) {
        if (lastReset + 100 > Date.now()) {
            return;
        }

        lastReset = Date.now();
        ch.emit(null, "/robot/tablet/clear");
        ch.node.status({});
    }

    function ShowImageNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/tablet/image";

        const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => {
            ch.emit(config.url);

            if (socket.connected) {
                node.send(msg);
            }
        });

        ch.socket.on("/robot/tablet/image/error", url => {
            if (url === config.url) {
                node.status({ fill: "red", shape: "dot", text: node.type + ".cantLoadImage" });
            }
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, async () => {
            resetNodeState(ch);
            node.status({});

            try {
                if (!config.url) {
                    return;
                }

                if (config.url in urlCache && urlCache[config.url] == false) {
                    node.status({ fill: "red", shape: "dot", text: node.type + ".inavlidUrl" })
                    return;
                }

                const { headers } = (await got.get(config.url));
                urlCache[config.url] = headers["content-type"].startsWith("image/");

                if (!headers["content-type"].startsWith("image/")) {
                    node.status({ fill: "red", shape: "dot", text: node.type + ".inavlidUrl" })
                }
            } catch (error) {
                urlCache[config.url] = false;
                node.status({ fill: "red", shape: "dot", text: node.type + ".inavlidUrl" })
                RED.log.warn("Checking " + config.url)
                RED.log.warn(error)
            }
        });
    }
    RED.nodes.registerType("Show image", ShowImageNode);
}