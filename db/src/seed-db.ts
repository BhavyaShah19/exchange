// db/src/seed-db.ts
import { Client } from 'pg';
import { dbConfig } from './config';
import { createTradesTable, createTradeViews } from './tables';

async function seedDatabase() {
    const client = new Client(dbConfig);

    try {
        await client.connect();

        // Create trades table and views
        await createTradesTable(client);
        await createTradeViews(client);
        
        console.log('Database seeded successfully');
    } catch (err) {
        console.error('Error seeding database:', err);
        throw err;
    } finally {
        await client.end();
    }
}

seedDatabase();