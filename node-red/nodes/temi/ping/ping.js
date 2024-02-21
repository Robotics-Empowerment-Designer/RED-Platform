module.exports = RED => {

    const EventPubSub = require('node-red-contrib-base/eventPubSub');
    const events = new EventPubSub();
    const https = require('http');
    RED.httpAdmin.get("/temi/ping", (req,res) => ping());

    function PingNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on("input", msg => {
            ping();
            node.send(msg);
        });

        events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
            waitingNode = null;
            node.status({});
        });
    }
    RED.nodes.registerType("Ping", PingNode);

    function ping(){
        //node.status({ fill: "blue", shape: "dot", text: node.type + ".pinging" });
        isConnected().then(error => {
            if(error === "") {
                //node.status({ fill: "green", shape: "dot", text: node.type + ".successful" });
                RED.notify("Temi ping successful", {type:"info"})
            } else {
                //node.status({ fill: "red", shape: "dot", text: node.type + ".error: " +
                //error });
                RED.notify("Temi ping successful")
                RED.notify("Connection failed...: " + error, {type:"warning"});
            }
        })
    }

    async function isConnected() { //TODO debug address
        https.get("http://" + process.env.TEMI_ADDRESS + ":" + process.env.TEMI_PORT,
         (resp) => {
            resp.on('end', (msg) => {
                return new Promise<String>("");
            });
            
        }).on('error', (err) => {
            return new Promise<String>(err.message);
        }) 
    }
}