const recognize_keyword_endpoint = "http://localhost:5720/record-audio"

module.exports = RED => {
    const fetch = require('node-fetch');

    const socket = require("../connection").socket;
    const ConnectionHelper = require("../connectionHelper");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    function RecognizeKeyword(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const ch = new ConnectionHelper(socket, node);

        node.on("input", () => {
            node.status({ fill: "blue", shape: "dot", text: node.type + "... recording audio ..." });

            fetch(recognize_keyword_endpoint, {
                method: "POST"
            })
            .then((response) => response.json())
            .then((jsonResponse) => {
                // Build Text for Pepper's tablet
                const detected_speech = `Text: ${jsonResponse.recognizedText}`

                detected_speech_tablet = detected_speech.toString().trim().split("\r\n");

                ch.emit(detected_speech_tablet, "/robot/tablet/text");
    
                let output = [];

                let included = false;

                const passedValue = {
                    payload: {
                    }
                }
                
                config.keywords.forEach(keyword => {
                    if (detected_speech.toLowerCase().includes(keyword.toLowerCase()) && !included) {
                        output.push(passedValue);
                        included = true;
                    }else{
                        output.push(null);
                    }
                });

                if(!included) {
                    output.push(true);
                }else{
                    output.push(null);
                }

                output.push(passedValue);

                node.send(output);
                
                node.status({});
            });
        });
    }

    RED.nodes.registerType("recognize_keyword", RecognizeKeyword);
}