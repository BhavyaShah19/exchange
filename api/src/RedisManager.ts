import { RedisClientType, createClient } from "redis";
import { MessageFromEngine} from "./types";
import { MessageToEngine } from "./types/to";

export class RedisManager{
    private static instance:RedisManager;
    private client:RedisClientType;
    private queue:RedisClientType

    private constructor(){
        this.client=createClient();
        this.client.connect();
        this.queue=createClient();
        this.queue.connect();
    }

    public static getInstance():RedisManager{
        if(!this.instance){
            this.instance=new RedisManager();
        }
        return this.instance;
    }
    public sendAndAwait(message:MessageToEngine){
        return new Promise<MessageFromEngine>((resolve)=>{
            const id=Math.random().toString(36).substring(2,15);
            this.client.subscribe(id,(message)=>{
                this.client.unsubscribe(id);
                resolve(JSON.parse(message));
            });
            this.queue.lPush("messages",JSON.stringify({clientId:id,message}))
        });
    }
}

