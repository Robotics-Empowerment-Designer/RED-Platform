class EventPubSub {
    static events = {}

    #add(event, callback) {
        if (event in EventPubSub.events) {
            EventPubSub.events[event].push(callback);
            return;
        }

        EventPubSub.events[event] = [callback];
    }

    subscribe(event, callback, error = null) {
        if (error || typeof callback !== "function") {
            RED.log.error("Wrong parameters for subscribe");
            return;
        }

        if (Array.isArray(event)) {
            event.forEach(e => {
                this.#add(e, callback);
            });
            return;
        }

        this.#add(event, callback)
    }

    unsubscribe(event, callback) {
        if (!event in EventPubSub.events) {
            return;
        }

        const index = EventPubSub.events[event].indexOf(callback);
        if (index > -1) {
            EventPubSub.events[event].splice(index, 1);
        }
    }

    trigger(event, data = null) {
        if (!(event in EventPubSub.events)) {
            return;
        }

        EventPubSub.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                if(RED != undefined) {
                    RED.log.error(error);
                }
                else {
                    console.log(data);
                }
            }
        });
    }
}

module.exports = EventPubSub;

module.exports.RESET_NODE_STATE = 1;
module.exports.STOP_EVENT = 2;
module.exports.STOP_EVENT_BUTTON_PRESSED = 3;
module.exports.UPDATE_JOIN_LUT = 4;
module.exports.INIT_EVENT = 5;