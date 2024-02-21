module.exports = RED => {
    const NodeHelper = require("../nodeHelper");
    const EventPubSub = require("../eventPubSub");

    const MIN_LOOP_TIME = 100; // time in ms

    const nodeHelper = new NodeHelper();
    const startNodeList = [];
    let stopNodesObj = {};
    let joinLutObj = {};
    let unfinishedStopNodes = {};
    let waiting = null;
    let stopLoop = false;
    let startTime = 0;

    const events = new EventPubSub();

    RED.httpAdmin.post("/start-node/:id", RED.auth.needsPermission("inject.write"), async (req, res) => {
        startTime = Date.now();
        const node = RED.nodes.getNode(req.params.id);
        res.end();

        if (node == null) {
            RED.log.warn("Start node not deployed yet");
            return;
        }

        if (waiting != null) {
            if (waiting.id === node.id) {
                node.status({ fill: "red", shape: "dot", text: node.type + ".flowCurrentlyRunning" });
            } else {
                node.status({ fill: "red", shape: "dot", text: node.type + ".anotherflowCurrentlyRunning" });
            }
            setTimeout(() => {
                if (waiting != null) {
                    if (waiting.id === node.id) {
                        node.status({ fill: "gray", shape: "dot", text: node.type + ".flowRunning" });
                    }
                    else {
                        node.status({ fill: "yellow", shape: "dot", text: node.type + ".anotherflowRunning" });
                    }
                }
                else {
                    node.status({});
                }
            }, 1500);

            return;
        }

        events.trigger(EventPubSub.RESET_NODE_STATE);

        startNodeList.forEach(n => {
            if (n.id === node.id) {
                n.status({ fill: "gray", shape: "dot", text: node.type + ".flowRunning" });
            } else {
                n.status({ fill: "yellow", shape: "dot", text: node.type + ".anotherflowRunning" });
            }
        });

        resetUnfinishedStopNodes(node);

        waiting = node;
        node.send(createMessage());

        // enableCamera(true);
    });

    events.subscribe(EventPubSub.STOP_EVENT, id => {
        try {
            const loop_time = Date.now() - startTime;
            let loopError = null;

            const node = RED.nodes.getNode(id);
            if (node == null) {
                return;
            }

            delete unfinishedStopNodes[JSON.stringify(node.id)];
            if (Object.keys(unfinishedStopNodes).length > 0) {
                return;
            }

            if (waiting != null && waiting.config.loop && !stopLoop) {
                if (loop_time > MIN_LOOP_TIME) {
                    resetUnfinishedStopNodes(waiting); // start-node that started the flow
                    waiting.send(createMessage());
                    events.trigger(EventPubSub.RESET_NODE_STATE);

                    startNodeList.forEach(n => {
                        if (n.id === waiting.id) {
                            n.status({ fill: "gray", shape: "dot", text: n.type + ".flowRunning" });
                        } else {
                            n.status({ fill: "yellow", shape: "dot", text: n.type + ".anotherflowRunning" });
                        }
                    });

                    return;
                }

                loopError = waiting;
            }

            startNodeList.forEach(n => {
                n.status({});
            });

            if (loopError) {
                loopError.status({ fill: "red", shape: "dot", text: loopError.type + ".loopTimeTooShort" });
            }

            waiting = null;
            stopLoop = false;

            // enableCamera(false);

            /* if (socket.connected) {
                socket.emit("/robot/tablet/clear");
            } */

            events.trigger(EventPubSub.RESET_NODE_STATE)
        } catch (error) {
            RED.log.error(error);
            RED.log.error(error.stack);
        }
    });

    RED.httpAdmin.post("/cancel-loop/:id", RED.auth.needsPermission("inject.write"), (req, res) => {
        // const node = RED.nodes.getNode(req.params.id); // Check for null
        res.end();

        waiting = null;
        stopLoop = false;

        startNodeList.forEach(n => {
            n.status({});
        });

        events.trigger(EventPubSub.RESET_NODE_STATE);
    });

    RED.events.on("flows:started", async () => {
        const [stopNodes, joinLut] = await nodeHelper.findStopInAllFlows();
        stopNodesObj = stopNodes;
        joinLutObj = joinLut;

        waiting = null;

        events.trigger(EventPubSub.INIT_EVENT);
        events.trigger(EventPubSub.RESET_NODE_STATE);
    });

    events.subscribe(EventPubSub.RESET_NODE_STATE, () => {
        try {
            stopLoop = false;

            events.trigger(EventPubSub.UPDATE_JOIN_LUT, joinLutObj);

            startNodeList.forEach(n => {
                if (stopNodesObj[JSON.stringify(n.id)].stopNodes.length === 0) {
                    n.status({ fill: "red", shape: "dot", text: n.type + ".noStopNode" });
                    return;
                }

                if (stopNodesObj[JSON.stringify(n.id)].stopNodes.length > 1) {
                    n.status({ fill: "red", shape: "dot", text: n.type + ".tooManyStopNodes" });
                    return;
                }

                if (stopNodesObj[JSON.stringify(n.id)].recursion) {
                    n.status({ fill: "red", shape: "dot", text: n.type + ".recursionDetected" });
                    return;
                }

                n.status({});
            });
        } catch (error) {
            RED.log.error(error);
            RED.log.error(error.stack);
        }
    });

    function resetUnfinishedStopNodes(node) {
        unfinishedStopNodes = {};

        stopNodesObj[JSON.stringify(node.id)].stopNodes.forEach(nodeId => {
            unfinishedStopNodes[nodeId] = false; // value irrelevant
        });
    }

    function createMessage() {
        return { _msgid: RED.util.generateId() };
    }

    function StartNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.config = config;

        startNodeList.push(node);

        node.on("close", (removed, done) => {
            const index = startNodeList.indexOf(node);
            if (index !== -1) {
                startNodeList.splice(index, 1);
            }

            done();
        });
    }
    RED.nodes.registerType("Start", StartNode);
}