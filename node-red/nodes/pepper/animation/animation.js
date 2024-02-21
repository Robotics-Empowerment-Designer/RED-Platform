module.exports = RED => {
    const got = require("got");
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const serverUrl = require('node-red-contrib-base/config').serverUrl;
    const EventPubSub = require('node-red-contrib-base/eventPubSub');
    let animations = require("./animations.json");
    let validAnimations = null;

    const events = new EventPubSub();
    events.subscribe(EventPubSub.INIT_EVENT, async () => {
        try {
            const animationNames = animations.reduce((acc, curVal) => acc.concat(curVal["value"]), []);
            const { body } = await got.post(`${serverUrl}/robot/animations/validate`, { json: { animations: animationNames } });
            const invalidAnimations = JSON.parse(body);

            validAnimations = animations.filter(animation => !invalidAnimations.includes(animation.value));
        }
        catch (error) {
            RED.log.error(error);
        }
    });

    RED.httpAdmin.get("/get-animations/:id", RED.auth.needsPermission("inject.write"), async (req, res) => {
        // const node = RED.nodes.getNode(req.params.id); // Check for null

        if (!validAnimations) {
            res.json([]);
            return;
        }

        res.json(validAnimations);
    });

    function RunAnimation(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/animation/run";

        let waitingNode = null;
        const ch = new ConnectionHelper(socket, node);

        node.on("input", msg => {
            waitingNode = msg;
            node.status({ fill: "blue", shape: "dot", text: node.type + ".runningAnimation" });

            ch.emit(config.animation);
        });

        ch.socket.on("/event/animation/finished", () => {
            if (!waitingNode) {
                return;
            }

            node.send(waitingNode);
            waitingNode = null;

            node.status({});
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            waitingNode = null;
            node.status({});
        });
    }
    RED.nodes.registerType("Animation", RunAnimation);
}