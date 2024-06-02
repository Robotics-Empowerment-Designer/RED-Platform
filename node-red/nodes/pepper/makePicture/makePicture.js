module.exports = RED => {
    function MakePictureNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
		const axios = require('axios');

        node.camera = config.camera || '0';  // Default to bottom if not set
        node.output = config.output || 'base64';  // Default to base64 if not set

        node.on('input', function(msg) {
            var camera = node.camera;
            var output = node.output;
            var path = node.path;

            var url = `http://localhost:5000/pepper/camera/?cameraIndex=${camera}&encoding=${output}`;
			node.status({ fill: "yellow", shape: "dot", text: "requesting" });

            axios.get(url)
                .then(response => {
                    msg.payload = response.data;
					node.status({ fill: "green", shape: "dot", text: "success" });
                    node.send(msg);
                })
                .catch(error => {
                    node.error("Error: " + error);
                    msg.payload = {error: error.message};
					node.status({ fill: "red", shape: "ring", text: "error" });
                    node.send(msg);
                });
        });

    }
    RED.nodes.registerType("Make Picture", MakePictureNode);
}
