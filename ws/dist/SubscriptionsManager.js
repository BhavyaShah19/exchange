"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsManager = void 0;
const redis_1 = require("redis");
const UserManager_1 = require("./UserManager");
class SubscriptionsManager {
    constructor() {
        this.subscriptions = new Map();
        this.reverseSubscriptions = new Map();
        this.redisClient = (0, redis_1.createClient)();
        this.redisClient.connect();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new SubscriptionsManager();
        }
        return this.instance;
    }
    subscribe(userId, channel) {
        var _a, _b, _c, _d;
        if ((_a = this.subscriptions.get(userId)) === null || _a === void 0 ? void 0 : _a.includes(channel)) {
            return;
        }
        this.subscriptions.set(userId, ((_b = this.subscriptions.get(userId)) !== null && _b !== void 0 ? _b : []).concat(channel));
        this.reverseSubscriptions.set(channel, ((_c = this.reverseSubscriptions.get(channel)) !== null && _c !== void 0 ? _c : []).concat(userId));
        // console.log("insisde reverse",this.reverseSubscriptions)
        if (((_d = this.reverseSubscriptions.get(channel)) === null || _d === void 0 ? void 0 : _d.length) === 1) {
            this.redisClient.subscribe(channel, (message, channel) => {
                var _a;
                const parsedMessage = JSON.parse(message);
                (_a = this.reverseSubscriptions.get(channel)) === null || _a === void 0 ? void 0 : _a.forEach(userId => { var _a; return (_a = UserManager_1.UserManager.getInstance().getUser(userId)) === null || _a === void 0 ? void 0 : _a.emit(parsedMessage); });
            });
        }
    }
    unSubscribe(userId, channel) {
        var _a;
        const subscriptions = this.subscriptions.get(userId);
        if (subscriptions) {
            this.subscriptions.set(userId, subscriptions.filter(s => s !== channel));
        }
        const reverseSubscriptions = this.reverseSubscriptions.get(channel);
        if (reverseSubscriptions) {
            this.reverseSubscriptions.set(channel, reverseSubscriptions.filter(s => s !== userId));
            if (((_a = this.reverseSubscriptions.get(channel)) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                this.reverseSubscriptions.delete(channel);
                this.redisClient.unsubscribe(channel);
            }
        }
    }
    userLeft(userId) {
        var _a;
        (_a = this.subscriptions.get(userId)) === null || _a === void 0 ? void 0 : _a.forEach(channel => this.unSubscribe(userId, channel));
    }
}
exports.SubscriptionsManager = SubscriptionsManager;
