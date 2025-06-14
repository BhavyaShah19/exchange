import { RedisClientType, createClient } from "redis";
import { MessageFromEngine} from "./types";
import { MessageToEngine } from "./types/to";

export class RedisManager{
    private static instance:RedisManager;
    private client:RedisClientType;
    private queue:RedisClientType

    private constructor(){
        this.client = createClient();
        this.queue = createClient();
        
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

    public static getInstance():RedisManager{
        if(!this.instance){
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    public async sendAndAwait(message:MessageToEngine): Promise<MessageFromEngine> {
        try {
            return new Promise<MessageFromEngine>((resolve, reject) => {
                const id = Math.random().toString(36).substring(2,15);
                
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
                    } catch (err) {
                        reject(new Error('Failed to parse Redis response'));
                    }
                });

                this.queue.lPush("messages", JSON.stringify({clientId: id, message}))
                    .catch(err => {
                        clearTimeout(timeout);
                        this.client.unsubscribe(id);
                        reject(err);
                    });
            });
        } catch (error) {
            console.error('Error in sendAndAwait:', error);
            throw error;
        }
    }
}

