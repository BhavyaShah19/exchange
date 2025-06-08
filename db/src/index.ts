import { createClient } from "redis";
import { Client } from "pg";
import { DbMessage, TRADE_ADDED } from "./types/fromEngine";

const pgClient=new Client({
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "postgres",
    port: 5432
});

pgClient.connect();

async function main() {
    const redisClient=createClient();
    await redisClient.connect();
    while(true){
        const response=await redisClient.brPop("db_processor" as string,0);
        if(response){
            const data:DbMessage=JSON.parse(response.element);
            if(data.type===TRADE_ADDED){
                const price=data.data.price;
                const timeStamp=data.data.timestamp;
                const query='INSERT INTO trades(timestamp,price) VALUES($1,$2)';
                const values=[timeStamp,price];
                pgClient.query(query,values);
            }   
        }
    }
}

main()