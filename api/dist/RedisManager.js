"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisManager = void 0;
const redis_1 = require("redis");
class RedisManager {
    constructor() {
        this.client = (0, redis_1.createClient)();
        this.queue = (0, redis_1.createClient)();
        // Add error handlers
        this.client.on('error', (err) => console.error('Redis Client Error:', err));
        this.queue.on('error', (err) => console.error('Redis Queue Error:', err));
        // Connect with error handling
        this.client.connect().catch(err => {
            console.error('Failed to connect to Redis client:', err);
            throw err;
        });
        this.queue.connect().catch(err => {
            console.error('Failed to connect to Redis queue:', err);
            throw err;
        });
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new RedisManager();
        }
        return this.instance;
    }
    sendAndAwait(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return new Promise((resolve, reject) => {
                    const id = Math.random().toString(36).substring(2, 15);
                    // Set a timeout for the response
                    const timeout = setTimeout(() => {
                        this.client.unsubscribe(id);
                        reject(new Error('Redis response timeout'));
                    }, 5000);
                    this.client.subscribe(id, (message) => {
                        clearTimeout(timeout);
                        this.client.unsubscribe(id);
                        try {
                            resolve(JSON.parse(message));
                        }
                        catch (err) {
                            reject(new Error('Failed to parse Redis response'));
                        }
                    });
                    this.queue.lPush("messages", JSON.stringify({ clientId: id, message }))
                        .catch(err => {
                        clearTimeout(timeout);
                        this.client.unsubscribe(id);
                        reject(err);
                    });
                });
            }
            catch (error) {
                console.error('Error in sendAndAwait:', error);
                throw error;
            }
        });
    }
}
exports.RedisManager = RedisManager;
