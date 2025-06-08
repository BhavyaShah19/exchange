import { Client } from "pg";

const pgClient=new Client({
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "postgres",
    port: 5432
});

pgClient.connect();

async function refreshViews(){
    await pgClient.query("REFRESH MATERIALIZED VIEW klines_1m");
    await pgClient.query("REFRESH MATERIALIZED VIEW klines_1h");
    await pgClient.query("REFRESH MATERIALIZED VIEW klines_1w");
}

setInterval(()=>{
    refreshViews()
},1000*10);