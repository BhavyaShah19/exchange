import { RedisClientType, createClient } from "redis";
import { UserManager } from "./UserManager";

export class SubscriptionsManager{
    private static instance:SubscriptionsManager;
    private subscriptions:Map<string,string[]>=new Map();
    private reverseSubscriptions:Map<string,string[]>=new Map();
    private redisClient:RedisClientType
    
    private constructor(){
        this.redisClient=createClient();
        this.redisClient.connect();
    }
    public static getInstance():SubscriptionsManager{
        if(!this.instance){
            this.instance=new SubscriptionsManager();
        }
        return this.instance;
    }
    public subscribe(userId:string,channel:string){
        if(this.subscriptions.get(userId)?.includes(channel)){
            return
        }
        this.subscriptions.set(userId,(this.subscriptions.get(userId)??[]).concat(channel));
        this.reverseSubscriptions.set(channel,(this.reverseSubscriptions.get(channel)??[]).concat(userId));
        // console.log("insisde reverse",this.reverseSubscriptions)
        if(this.reverseSubscriptions.get(channel)?.length===1){
            this.redisClient.subscribe(channel, (message: string, channel: string) => {
                const parsedMessage = JSON.parse(message);
                this.reverseSubscriptions.get(channel)?.forEach(userId =>
                    UserManager.getInstance().getUser(userId)?.emit(parsedMessage)
                );
            });
        }
    }
    public unSubscribe(userId:string,channel:string){
        const subscriptions=this.subscriptions.get(userId);
        if(subscriptions){
            this.subscriptions.set(userId,subscriptions.filter(s=>s!==channel));
        }
        const reverseSubscriptions=this.reverseSubscriptions.get(channel);
        if(reverseSubscriptions){
            this.reverseSubscriptions.set(channel,reverseSubscriptions.filter(s=>s!==userId));
            if(this.reverseSubscriptions.get(channel)?.length===0){
                this.reverseSubscriptions.delete(channel);
                this.redisClient.unsubscribe(channel);
            }
        }
    }
    public userLeft(userId:string){
        this.subscriptions.get(userId)?.forEach(channel=>this.unSubscribe(userId,channel)); 
    }
    
}