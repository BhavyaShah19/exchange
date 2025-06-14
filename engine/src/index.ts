import { RedisClientType, createClient } from "redis";
import { Engine } from "./trade/Engine";
async function main() {
    const engine = new Engine();
    const client = createClient();
    await client.connect();
    console.log("connected to redis");
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

main()
