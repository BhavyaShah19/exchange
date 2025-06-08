import { Router } from "express";
// import { Client } from 'pg';
import {Client} from 'pg';


const pgClient=new Client({
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "postgres",
    port: 5432
});

pgClient.connect();
export const klineRouter = Router();

klineRouter.get("/", async (req, res) => {
    const { market, interval, startTime, endTime } = req.query;
    let query
    switch (interval) {
        case "1m":
            query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2`;
            break;
        case "1h":
            query = `SELECT * FROM klines_1h WHERE bucket >= $1 AND bucket <= $2`;
            break;
        case "1w":
            query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2`;
            break;
        default:
            break;
    }
    try {
        const startTimeNew=new Date(Number(startTime) * 1000);
        const endTimeNew=new Date(Number(endTime) * 1000);
        const result=await pgClient.query(query as string, [startTimeNew, endTimeNew]);
        console.log("object",result)
        res.json(result.rows.map(x => ({
            close: x.close,
            end: x.bucket,
            high: x.high,
            low: x.low,
            open: x.open,
            quoteVolume: x.quoteVolume,
            start: x.start,
            trades: x.trades,
            volume: x.volume,
        })));
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
})

