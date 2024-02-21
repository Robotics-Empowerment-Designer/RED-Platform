module.exports = RED => {
    const nodeRedPort = require('node-red-contrib-base/config').nodeRedPort;
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    const events = new EventPubSub();

    //Experiemntal node: sometimes flow doesn't continue after this node

    function awarenessConfig(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/life/awareness/config";
        node.status({});

        let waitingNode = null;
        const ch = new ConnectionHelper(socket, node);
        node.on("input", msg => {
            console.log(config)
            waitingNode = msg;

            ch.emit([config.autonomousBlinking, config.backgroundMovement,
                 config.basicAwareness, config.listeningMovement,
                 config.speakingMovement]);
        });

        setTimeout(() => {
            node.send(waitingNode);
            waitingNode = null;
        }, 2000);
        
    }
    RED.nodes.registerType("AwarenessConfig", awarenessConfig);
}