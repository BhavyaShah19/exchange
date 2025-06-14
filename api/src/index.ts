import express from 'express';
import cors from 'cors'
import { orderBook } from './routes/order';
import { klineRouter } from './routes/kline';
import { depthRouter } from './routes/depth';
import { tickerRouter } from './routes/ticker';
import { tradesRouter } from './routes/trades';

const app = express();
app.use(cors())
app.use(express.json());

app.use("/api/v1/order",orderBook);
app.use("/api/v1/klines",klineRouter);
app.use("/api/v1/depth",depthRouter)
app.use("/api/v1/tickers",tickerRouter)
app.use("/api/v1/trades",tradesRouter)

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});