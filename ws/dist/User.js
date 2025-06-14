"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const IncomingMessage_1 = require("./types/IncomingMessage");
const SubscriptionsManager_1 = require("./SubscriptionsManager");
class User {
    constructor(id, ws) {
        this.id = id;
        this.ws = ws;
        this.addListeners();
    }
    addListeners() {
        this.ws.on("message", (message) => {
            console.log("Message came from user", message);
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.method === IncomingMessage_1.SUBSCRIBE) {
                parsedMessage.params.forEach(s => SubscriptionsManager_1.SubscriptionsManager.getInstance().subscribe(this.id, s));
            }
            if (parsedMessage.method === IncomingMessage_1.UNSUBSCRIBE) {
                parsedMessage.params.forEach(s => SubscriptionsManager_1.SubscriptionsManager.getInstance().unSubscribe(this.id, s));
            }
        });
    }
    emit(message) {
        this.ws.send(JSON.stringify(message));
        console.log("emitted the message from emit", message);
    }
}
exports.User = User;
