const SENTIMENT = Object.freeze({
    "POSITIVE": "positive",
    "NEGATIVE": "negative"
})

module.exports = RED => {
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    const events = new EventPubSub();

    function SentimentAnalysis(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.path = "/robot/sentiment/analysis";

        let waitingNode = null;
        const ch = new ConnectionHelper(socket, node);

        node.on("input", () => {
            waitingNode = msg;
            node.status({ fill: "blue", shape: "dot", text: node.type + "... recording audio ..." });
            ch.emit();
        });

        ch.socket.on("/event/sentiment/analysis", detectedSentiment => {
            if (!waitingNode) {
                return;
            }

            const output = [];
            Object.values(SENTIMENT).forEach(sentimentComp => {
                output.push(sentimentComp === detectedSentiment);
            });

            // Falls es nicht funktioniert, ersetzen durch:
            /*
                Object.values(SENTIMENT).forEach(sentimentComp => {
                    output.push(sentimentComp === detectedSentiment? true : null)
                });
            */            

            node.send(output);

            node.send(waitingNode);
            waitingNode = null;
            
            node.status({});
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            waitingNode = null;
            node.status({});
        });
    }

    RED.nodes.registerType("Sentiment Analysis", SentimentAnalysis);
}