const sentiment_analysis_endpoint = "http://localhost:5728/sentiment-analysis"

const SENTIMENT = Object.freeze({
    "POSITIVE": "positive",
    "NEGATIVE": "negative"
})

module.exports = RED => {
    const fetch = require('node-fetch');

    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    function SentimentAnalysis(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const ch = new ConnectionHelper(socket, node);

        node.on("input", () => {
            node.status({ fill: "blue", shape: "dot", text: node.type + "... recording audio ..." });

            fetch(sentiment_analysis_endpoint, {
                method: "POST"
            })
            .then((response) => response.json())
            .then((jsonResponse) => {
                // Build Text for Pepper's tablet
                const detected_speech = `Text: ${jsonResponse.recognizedText}`
                const detected_sentiment = `Sentiment: ${jsonResponse.sentiment}`

                let concatenated = `${detected_speech}\r\n${detected_sentiment}`;

                concatenated = concatenated.trim().split("\r\n");

                ch.emit(concatenated, "/robot/tablet/text");
    
                let output = [];

                Object.values(SENTIMENT).forEach(sentimentComp => {
                    output.push(sentimentComp === jsonResponse.sentiment? true : null)
                });

                node.send(output);
                
                node.status({});
            });
        });
    }

    RED.nodes.registerType("sentiment_analysis", SentimentAnalysis);
}