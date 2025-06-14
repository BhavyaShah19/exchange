import { Router } from "express";
import {Client} from 'pg';


const pgClient=new Client({
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "postgres",
    port: 5432
});

pgClient.connect();
export const tradesRouter = Router();

tradesRouter.get("/", async (req, res) => {
    const { market } = req.query;
    

    // get from DB
    res.json({});
})
