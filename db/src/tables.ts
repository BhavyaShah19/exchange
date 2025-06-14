import { Client } from 'pg';

export async function createTradesTable(client: Client) {
    // Create trades table
    await client.query(`
        CREATE TABLE IF NOT EXISTS trades (
            id VARCHAR(255) PRIMARY KEY,
            market VARCHAR(50) NOT NULL,
            timestamp BIGINT NOT NULL,
            price DECIMAL NOT NULL,
            quantity DECIMAL NOT NULL,
            quote_quantity DECIMAL NOT NULL,
            is_buyer_maker BOOLEAN NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Create indexes for better query performance
    await client.query(`
        CREATE INDEX IF NOT EXISTS idx_trades_market_timestamp 
        ON trades (market, timestamp DESC);

        CREATE INDEX IF NOT EXISTS idx_trades_timestamp 
        ON trades (timestamp DESC);
    `);

    // Convert to TimescaleDB hypertable if not already
    try {
        await client.query(`
            SELECT create_hypertable('trades', 'timestamp', 
                chunk_time_interval => 86400000, -- 1 day in milliseconds
                if_not_exists => TRUE
            );
        `);
    } catch (error) {
        console.log('Table might already be a hypertable or TimescaleDB extension not enabled');
    }
}

export async function createTradeViews(client: Client) {
    // Create 1-minute klines view
    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
        SELECT
            time_bucket('1 minute', to_timestamp(timestamp/1000)) AS bucket,
            market,
            first(price, timestamp) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, timestamp) AS close,
            sum(quantity) AS volume,
            sum(quote_quantity) AS quote_volume,
            count(*) AS trades
        FROM trades
        GROUP BY bucket, market;    
    `);

    // Create 5-minute klines view
    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_5m AS
        SELECT
            time_bucket('5 minutes', to_timestamp(timestamp/1000)) AS bucket,
            market,
            first(price, timestamp) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, timestamp) AS close,
            sum(quantity) AS volume,
            sum(quote_quantity) AS quote_volume,
            count(*) AS trades
        FROM trades
        GROUP BY bucket, market;
    `);

    // Create 1-hour klines view
    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
        SELECT
            time_bucket('1 hour', to_timestamp(timestamp/1000)) AS bucket,
            market,
            first(price, timestamp) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, timestamp) AS close,
            sum(quantity) AS volume,
            sum(quote_quantity) AS quote_volume,
            count(*) AS trades
        FROM trades
        GROUP BY bucket, market;
    `);
}

export async function refreshTradeViews(client: Client) {
    await client.query('REFRESH MATERIALIZED VIEW klines_1m');
    await client.query('REFRESH MATERIALIZED VIEW klines_5m');
    await client.query('REFRESH MATERIALIZED VIEW klines_1h');
} 