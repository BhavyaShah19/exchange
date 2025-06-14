import { createClient } from "redis";
import { Client } from "pg";
import { DbMessage, TRADE_ADDED } from "./types/fromEngine";
import { dbConfig } from "./config";
import { createTradesTable, createTradeViews } from "./tables";

const pgClient=new Client(dbConfig);
pgClient.connect();

async function main() {
    const redisClient=createClient();
    await redisClient.connect();
    try {
        await createTradesTable(pgClient);
        console.log('Trades table is ready');
        
        await createTradeViews(pgClient);
        console.log('Trade views are ready');
    } catch (error) {
        console.error('Error creating trades table or views:', error);
        process.exit(1);
    }
    while(true){
        const response=await redisClient.brPop("db_processor" as string,0);
        if(response){
            const data:DbMessage=JSON.parse(response.element);
            if(data.type===TRADE_ADDED){
                const { id, market, timestamp, price, quantity, quoteqty, isBuyerMaker } = data.data;
                const query = `INSERT INTO trades (id, market, timestamp, price, quantity, quote_quantity, is_buyer_maker) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
                const values = [id, market, timestamp, price, quantity, quoteqty, isBuyerMaker];
                await pgClient.query(query, values);
            }   
        }
    }
}

main()