import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { CREATE_ORDER, CANCEL_ORDER, GET_OPEN_ORDERS } from "../types";
export const orderBook = Router();

orderBook.post("/", async (req, res) => {
  console.log("Full request body:", req.body);
  console.log("Request headers:", req.headers);
  console.log("Content-Type:", req.headers['content-type']);
  
  const { market, quantity, price, side, userId } = req.body;
  console.log("Destructured values:", { market, quantity, price, side, userId });
  
  const response = await RedisManager.getInstance().sendAndAwait({
    type: CREATE_ORDER,
    data: {
      market,
      quantity,
      price,
      side,
      userId
    }
  });
  res.send(response.payload);
});

orderBook.delete("/", async (req, res) => {
  const { market, orderId } = req.body;
  const response = await RedisManager.getInstance().sendAndAwait({
    type: CANCEL_ORDER,
    data: {
      orderId,
      market
    }
  });
  res.send(response.payload);
});

orderBook.get("/open", async (req, res) => {
  const response = await RedisManager.getInstance().sendAndAwait({
    type: GET_OPEN_ORDERS,
    data: {
      userId: req.query.userId as string,
      market: req.query.market as string
    }
  });
  res.send(response.payload);
});