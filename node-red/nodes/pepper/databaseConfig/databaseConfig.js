module.exports = function (RED) {
    function DatabaseConfigNode(node) {
        RED.nodes.createNode(this, node);

        this.configName = node.configName;
        this.data = node.data;
    }
    RED.nodes.registerType("Database config", DatabaseConfigNode);
}