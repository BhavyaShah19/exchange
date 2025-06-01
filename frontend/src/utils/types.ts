// types for the depth page for asks and bids 
// can I apply zod here?

import { z } from "zod";

const klineSchema = z.object({
    close: z.string(),
    end: z.string(),
    high: z.string(),
    low: z.string(),
    open: z.string(),
    quoteVolume: z.string(),
    start: z.string(),
    trades: z.string(),
    volume: z.string(),
})

const tradeSchema = z.object({
    id: z.number(),
    isBuyerMaker: z.boolean(),
    price: z.string(),
    quantity: z.string(),
    quoteQuantity: z.string(),
    timestamp: z.number(),
});

const depthSchema = z.object({
    asks: z.array(z.tuple([z.string(), z.string()])),
    bids: z.array(z.tuple([z.string(), z.string()])),
    lastUpdateId: z.string(),
});


const tickerSchema = z.object({
    firstPrice: z.string(),
    high: z.string(),
    lastPrice: z.string(),
    low: z.string(),
    priceChange: z.string(),
    priceChangePercent: z.string(), 
    quoteVolume: z.string(),
    symbol: z.string(),
    trades: z.string(),
    volume: z.string(),
})


export type Depth = z.infer<typeof depthSchema>;
export type Trade = z.infer<typeof tradeSchema>;
export type Ticker = z.infer<typeof tickerSchema>;
export type Kline = z.infer<typeof klineSchema>;
