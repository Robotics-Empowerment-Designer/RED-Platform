const got = require("got");
const nodeRedPort = require("./config").nodeRedPort;

class NodeHelper {
    async getFlows() {
        const { body } = await got.get(`http://localhost:${nodeRedPort}/flows`, { responseType: "json" });

        const flows = [];

        for (const flow of body) {
            if (flow.type === "tab") {
                flows.push(flow.id);
            }
        }

        return flows;
    }

    async getNodesInFlow(flowId) {
        const { body } = (await got.get(`http://localhost:${nodeRedPort}/flow/${flowId}`, { responseType: "json" }));
        return body.nodes;
    }

    async countStartStop(flowId) {
        const nodes = await this.getNodesInFlow(flowId);

        let startCount = 0;
        let stopCount = 0;

        for (const node of nodes) {
            if (node.type === "Start") {
                startCount++;
            }
            else if (node.type === "Stop") {
                stopCount++;
            }
        }

        return [startCount, stopCount];
    }

    async findStopInAllFlows() {
        const flows = await this.getFlows();

        const startStopLut = {};
        const joinLut = {};
        for (const flowId of flows) {
            await this.findStop(flowId, startStopLut, joinLut);
        }

        return [startStopLut, joinLut];
    }

    async findStop(flowId, startStopLut, joinLut) {
        const nodes = await this.getNodesInFlow(flowId);

        const nodesLut = {};
        for (const node of nodes) {
            node.counter = 0;
            nodesLut[JSON.stringify(node.id)] = node;
        }

        for (const node of nodes) {
            if (node.type === "Start") {
                // we need stringify because node ids are sometimes illegal object keys
                startStopLut[JSON.stringify(node.id)] = { "stopNodes": [], "recursion": false };
                this.traverse(nodesLut, JSON.stringify(node.id), JSON.stringify(node.id), startStopLut, joinLut);
            }
        }
    }

    traverse(nodesLut, nodeId, startId, startStopLut, joinLut, depth = 100) {
        if (nodesLut[nodeId].type === "Stop") {
            if (!startStopLut[startId].stopNodes.includes(nodeId)) {
                startStopLut[startId].stopNodes.push(nodeId);
            }

            return;
        }

        if (++nodesLut[nodeId].counter >= 1000) {
            startStopLut[startId].recursion = true;
            return;
        }

        if (depth == 0) {
            startStopLut[startId].recursion = true;
            return;
        }

        nodesLut[nodeId].wires.forEach(outputs => {
            outputs.forEach(wire => {
                const wireString = JSON.stringify(wire);

                if (nodesLut[wireString].type === "Join") {
                    if (joinLut.hasOwnProperty(wireString)) {
                        joinLut[wireString].add(nodeId);
                    } else {
                        joinLut[wireString] = new Set([nodeId]);
                    }
                }

                this.traverse(nodesLut, wireString, startId, startStopLut, joinLut, depth - 1);
            });
        });
    }
}

module.exports = NodeHelper;
