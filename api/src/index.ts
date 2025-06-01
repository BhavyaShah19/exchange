import express from 'express';
import { orderBook } from './routes/order';

const app = express();
app.use(express.json());
app.use("/api/v1/order",orderBook);

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});