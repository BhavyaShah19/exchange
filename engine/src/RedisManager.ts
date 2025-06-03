import { RedisClientType,createClient } from "redis";
import { DbMessage } from "./types/dbType";
import { wsMessage } from "./types/toWs";
import { toAPI } from "./types/toAPI";

export class RedisManager{
    private static instance:RedisManager;
    private client:RedisClientType;
    private constructor(){
        this.client=createClient();
        this.client.connect();
    }
    public static getInstance():RedisManager{
        if(!this.instance){
            this.instance=new RedisManager();
        }
        return this.instance;
    }
    public pushMessage(message:DbMessage){
        this.client.lPush("db_processor",JSON.stringify(message));
    }
    public publishMessageForWs(channel:string,message:wsMessage){
        this.client.publish(channel,JSON.stringify(message));
    }
    public sendToApi(clientId:string,message:toAPI){
        this.client.publish(clientId,JSON.stringify(message));
    }   
    
}