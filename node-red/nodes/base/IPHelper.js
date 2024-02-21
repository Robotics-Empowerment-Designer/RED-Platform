const { networkInterfaces } = require("os");

const nets = networkInterfaces();
const results = []

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        const familyV4Value = typeof net.family === "string" ? "IPv4" : 4
        if (net.family === familyV4Value && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            results.push(net.address);
        }
    }
}

module.exports.ip = results[0];
