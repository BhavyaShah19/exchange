"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const SubscriptionsManager_1 = require("./SubscriptionsManager");
const User_1 = require("./User");
class UserManager {
    constructor() {
        this.users = new Map();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new UserManager();
        }
        return this.instance;
    }
    addUser(ws) {
        const id = this.getRandomId();
        const user = new User_1.User(id, ws);
        this.users.set(id, user);
        this.registerOnClose(ws, id);
        return user;
    }
    registerOnClose(ws, userId) {
        ws.on("close", () => {
            this.users.delete(userId);
            SubscriptionsManager_1.SubscriptionsManager.getInstance().userLeft(userId);
        });
    }
    getRandomId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    getUser(id) {
        return this.users.get(id);
    }
}
exports.UserManager = UserManager;
