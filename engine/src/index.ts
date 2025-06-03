import RedisClient from "@redis/client/dist/lib/client";
import { RedisClientType, createClient } from "redis";
import { Engine } from "./trade/Engine";
async function main() {
    const client = createClient();
    const engine = new Engine();
    await client.connect();
    while (true) {
        // continuously pop messages from redis messages channel and process them
        const message = await client.rPop("messages")
        if(!message){
            continue;
        }
        else{
            engine.process(JSON.parse(message));
        }
            
    }
}
