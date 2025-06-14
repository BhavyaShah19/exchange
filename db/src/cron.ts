import { Client } from "pg";
import { dbConfig } from "./config";
import { refreshTradeViews } from "./tables";

const pgClient = new Client(dbConfig);
pgClient.connect();

async function refreshViews() {
    try {
        await refreshTradeViews(pgClient);
        console.log('Views refreshed successfully');
    } catch (error) {
        console.error('Error refreshing views:', error);
    }
}

setInterval(() => {
    refreshViews();
}, 1000 * 10); // Refresh every 10 seconds