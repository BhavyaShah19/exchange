import { ClientConfig } from 'pg';

export const dbConfig: ClientConfig = {
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "postgres",
    port: 5432
}; 