const sentiment_analysis_endpoint = "http://localhost:5728/sentiment-analysis"

const SENTIMENT = Object.freeze({
    "POSITIVE": "positive",
    "NEGATIVE": "negative"
})

module.exports = RED => {
    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    function SentimentAnalysis(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const ch = new ConnectionHelper(socket, node);

        let waitingNode = null;

        node.on("input", () => {
            waitingNode = msg;
            node.status({ fill: "blue", shape: "dot", text: node.type + "... recording audio ..." });

            fetch(sentiment_analysis_endpoint, {
                method: "POST"
            }).then(response => {
                ch.emit("Test", "/robot/tablet/text");
                /*if (!waitingNode) {
                    return;
                }
    
                const output = [];
                Object.values(SENTIMENT).forEach(sentimentComp => {
                    output.push(sentimentComp === detectedSentiment);
                });
    
                // Falls es nicht funktioniert, ersetzen durch:
                
                    Object.values(SENTIMENT).forEach(sentimentComp => {
                        output.push(sentimentComp === detectedSentiment? true : null)
                    });
                           
    
                node.send(output);
    
                node.send(waitingNode);
                waitingNode = null;
                
                node.status({});*/
            })
        });
    }

    RED.nodes.registerType("Sentiment Analysis", SentimentAnalysis);
}