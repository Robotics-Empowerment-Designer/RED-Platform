class ConnectionHelper {
    constructor(socket, node) {
        this.socket = socket;
        this.node = node;

        this.initSocket();
    }

    initSocket() {
        if (this.socket.connected) {
            this.connected();
        } else {
            this.disconnected();
        }

        this.socket.on("connect", () => {
            this.connected();
        });

        this.socket.on("disconnect", () => {
            this.disconnected();
        });

        // triggert when node gets deleted
        this.node.on("close", (removed, done) => {
            this.socket.emit(this.node.path + "/close");
            done();
        });
    }

    connected() {
        this.node.status({});
        this.node.log(this.node.path + " connected");
    }

    disconnected() {
        this.node.status({ fill: "red", shape: "dot", text: this.node.type + ".connectionError" });
        this.node.log(this.node.path + " disconnected");
    }

    emit(message = null, path = this.node.path) {
        if (!this.socket.connected) {
            return;
        }

        if (message) {
            this.socket.emit(path, message);
        }
        else {
            this.socket.emit(path);
        }
    }
}

module.exports = ConnectionHelper;
