module.exports = RED => {
    const EventPubSub = require('node-red-contrib-base/eventPubSub');
    const configData = {};

    const events = new EventPubSub();

    RED.httpAdmin.post("/database-config/:id", RED.auth.needsPermission("inject.write"), (req, res) => {
        if (configData.hasOwnProperty(req.params.id)) {
            res.json(configData[req.params.id]);
            return;
        }

        const databaseConfig = RED.nodes.getNode(req.params.id);
        res.json(databaseConfig.data);
    });

    RED.httpAdmin.post("/update-config/:id", RED.auth.needsPermission("inject.write"), (req, res) => {
        configData[req.params.id] = req.body;
        res.end();
    });

    function getUniqueLocations(node) {
        const locations = [];
        node.database.data.forEach(row => {
            if (locations.some(l => l.toLowerCase() === row.location.toLowerCase())) {
                return;
            }

            locations.push(row.location);
        });

        locations.push(RED._(node.type + ".error"));

        return locations;
    }

    function DatabaseNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.database = RED.nodes.getNode(config.database);

        if (!node.database) {
            node.status({ fill: "red", shape: "dot", text: node.type + ".invalidData" });
        } else {
            node.status({});
        }

        node.on("input", msg => {
            const locations = getUniqueLocations(node);
            const output = new Array(locations.length).fill(null);

            let input = msg.payload;

            // use injected value from payload
            if (typeof msg.payload == "object" && "value" in msg.payload) {
                input = msg.payload.value;
            }

            if (input == undefined) {
                node.status({ fill: "yellow", shape: "dot", text: node.type + ".emptyInput" });

                msg.payload = RED._(node.type + ".emptyInput");
                output[locations.length - 1] = msg;
                node.send(output);

                return;
            }

            const row = node.database.data.find(row => row.id == input);
            if (row == undefined) {
                msg.payload.value = input;
                output[locations.length - 1] = msg;

                node.send(output);
                node.status({});
                return;
            }

            const index = locations.findIndex(x => x == row.location);
            if (index == -1) {
                node.status({ fill: "red", shape: "dot", text: node.type + ".locationNotFound" });
                return;
            }

            msg.payload = {
                "id": row.id,
                "name": row.name,
                "location": row.location,
                "value": row.location
            };

            output[index] = msg;
            node.send(output);

            node.status({});
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            node.status({});
        });
    }
    RED.nodes.registerType("Database", DatabaseNode);
}