import express from 'express';
import { orderBook } from './routes/order';
import { klineRouter } from './routes/kline';
import { depthRouter } from './routes/depth';
import { tickerRouter } from './routes/ticker';

const app = express();
app.use(express.json());

app.use("/api/v1/order",orderBook);
app.use("/api/v1/klines",klineRouter);
app.use("/api/v1/depth",depthRouter)
app.use("/api/v1/tickers",tickerRouter)
app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});