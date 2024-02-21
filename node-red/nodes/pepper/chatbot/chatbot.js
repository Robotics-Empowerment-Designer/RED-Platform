module.exports = RED => {
    const openaiAPIKey = process.env.OPENAI_API_KEY;
    const got = require("got");
    const EventPubSub = require('node-red-contrib-base/eventPubSub');

    const events = new EventPubSub();

    function ChatbotNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        let waiting = false;

        if (!openaiAPIKey) {
            node.status({ fill: "red", shape: "dot", text: node.type + ".apiKeyEmpty" });
        }

        node.on("input", async msg => {
            let input = msg.payload;
            waiting = true;

            // use injected value from payload
            if (typeof msg.payload == "object" && "value" in msg.payload) {
                input = msg.payload.value;
            }

            // if node property input is not empty, use user input instead
            if (config.text !== "") {
                input = config.text;
            }

            if (input == "") {
                node.status({ fill: "red", shape: "dot", text: node.type + ".emptyInput" });
                return;
            }

            node.status({ fill: "blue", shape: "dot", text: node.type + ".waitingForAnswer" });

            const openAISettings = {
                prompt: input,
                model: "text-davinci-003",
                max_tokens: 250
            };

            const headers = {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + openaiAPIKey
            }

            try {
                const { body } = await got.post("https://api.openai.com/v1/completions", { json: openAISettings, headers });
                const json = JSON.parse(body);
                const answer = json.choices[0].text.trim();
                const tokens = json.usage.total_tokens;
                const cost = tokens * 0.00002;

                node.log(`The last answer used ${tokens} tokens (~${cost.toFixed(5)}$).`);
                msg = { payload: answer };
            } catch (error) {
                node.error("Chatbot error: " + error);
                msg = { payload: error };
            }

            if (!waiting) {
                return;
            }

            node.send(msg);
            node.status({});
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            waiting = false;
            node.status({});
        });
    }
    RED.nodes.registerType("Chatbot", ChatbotNode);
}