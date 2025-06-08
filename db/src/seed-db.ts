// db/src/seed-db.ts
import { Client } from 'pg';
import { createViews } from './views';

async function seedDatabase() {
    const client = new Client({
        user: 'your_user',
        host: 'timescaledb',
        database: 'my_database',
        password: 'your_password',
        port: 5432,
    });

    try {
        await client.connect();

        await client.query(`
            CREATE TABLE IF NOT EXISTS tata_prices (
                time TIMESTAMPTZ NOT NULL,
                price DOUBLE PRECISION NOT NULL,
                volume DOUBLE PRECISION NOT NULL,
                currency_code TEXT NOT NULL
            );
        `);

        // Create TimescaleDB hypertable
        await client.query(`
            SELECT create_hypertable('tata_prices', 'time');
        `);

        // Create views
        await createViews(client);

        // Seed initial data if needed
        await client.query(`
            INSERT INTO tata_prices (time, price, volume, currency_code)
            VALUES 
                (NOW(), 100.0, 1000.0, 'INR'),
                (NOW(), 101.0, 2000.0, 'INR');
        `);

    } catch (err) {
        console.error('Error seeding database:', err);
        throw err;
    } finally {
        await client.end();
    }
}

seedDatabase();