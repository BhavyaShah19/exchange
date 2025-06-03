
// this will be the main class where every business logic will be implemented and this class also publishes the events to the redis
import { RedisManager } from "../RedisManager";
import { ORDER_UPDATE, TRADE_ADDED } from "../types";
import { fromAPI } from "../types/fromAPI";
import { CANCEL_ORDER, CREATE_ORDER, GET_OPEN_ORDERS } from "../types/toAPI";
import { Order, OrderBook, Fill } from "./OrderBook";

interface UserBalance {
    [key: string]: {
        available: number,
        locked: number
    }
}
export class Engine {
    private Balance: Map<string, UserBalance> = new Map();
    private orderBooks: OrderBook[] = [];
    constructor() {

    }
    public process({ message, clientId }: {
        message: fromAPI,
        clientId: string
    }) {
        switch (message.type) {
            case CREATE_ORDER:
                this.createOrder(message.data.market, message.data.side, message.data.quantity, message.data.price, message.data.userId);
                break;
            case CANCEL_ORDER:

                break;
            case GET_OPEN_ORDERS:
                break;

            default:
                break;
        }
    }
    createOrder(market: string, side: "buy" | "sell", quantity: string, price: string, userId: string) {
        const orderBook = this.orderBooks.find(orderBook => orderBook.ticker() === market);
        const baseAsset = market.split("_")[0];
        const quoteAsset = market.split("_")[1];
        if (!orderBook) {
            throw new Error("OrderBook not found");
        }
        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId, quantity, price);
        const order: Order = {
            price: Number(price),
            quantity: Number(quantity),
            orderId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            filled: 0,
            side,
            userId
        }
        const { executedQty, fills } = orderBook.addOrder(order);

        this.updateBalance(baseAsset, quoteAsset, side, userId, executedQty, fills);
        this.createDBTrades(fills, userId, market);
        this.updateDBOrders(order, executedQty, fills, market);
        this.publishWsDepthUpdates(market, fills, side, price);
        this.publishWsTrades(fills,userId,market)

    }
    checkAndLockFunds(baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string, quantity: string, price: string) {
        if (side === "buy") {
            const userBalance = this.Balance.get(userId)
            if (!userBalance) {
                throw new Error("User not found");
            }
            const quoteBalance = userBalance[quoteAsset]
            if (!quoteBalance) {
                throw new Error("Quote asset balance not found");
            }
            const requiredBalance = Number(quantity) * Number(price);
            if (quoteBalance.available < requiredBalance) {
                throw new Error("Insufficient funds");
            }
            quoteBalance.available -= Number(quantity) * Number(price);
            quoteBalance.locked += Number(quantity) * Number(price);
        }
        else {
            const userBalance = this.Balance.get(userId)
            if (!userBalance) {
                throw new Error("User not found");
            }
            const baseBalance = userBalance[baseAsset]
            if (!baseBalance) {
                throw new Error("Base asset balance not found");
            }
            const requiredAmount = Number(quantity);
            if (requiredAmount > baseBalance.available) {
                throw new Error("Insufficient funds");
            }
        }
    }

    updateBalance(baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string, executedQty: number, fills: Fill[]) {//BTC_USDC baseAsset_quoteAsset
        //jo side buy hoy quoteAsset ochu thase ane baseAsset vadhse
        // ane same vada nu quote vadhse ane base ochu thase.
        if (side === "buy") {
            fills.forEach(fill => {
                // @ts-ignore
                this.Balance.get(fill.otherUserId)[quoteAsset].available += Number(fill.quantity) * Number(fill.price);
                // @ts-ignore
                this.Balance?.get(userId)?.[quoteAsset].locked -= Number(fill.quantity) * Number(fill.price);


                // @ts-ignore
                this.Balance.get(fill.otherUserId)[baseAsset].locked -= Number(fill.quantity);
                // @ts-ignore
                this.Balance?.get(userId)?.[baseAsset].available += Number(fill.quantity);
            })
        }
        else {
            fills.forEach(fill => {
                //@ts-ignore
                this.Balance.get(fill.otherUserId)[quoteAsset].locked = this.Balance.get(fill.otherUserId)?.[quoteAsset].locked - (fill.quantity * fill.price);

                //@ts-ignore
                this.Balance.get(userId)[quoteAsset].available = this.Balance.get(userId)?.[quoteAsset].available + (fill.quantity * fill.price);



                //@ts-ignore
                this.Balance.get(fill.otherUserId)[baseAsset].available = this.Balance.get(fill.otherUserId)?.[baseAsset].available + fill.quantity;

                //@ts-ignore
                this.Balance.get(userId)[baseAsset].locked = this.Balance.get(userId)?.[baseAsset].locked - (fill.quantity);
            });
        }

    }

    createDBTrades(fills: Fill[], userId: string, market: string) {
        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: TRADE_ADDED,
                data: {
                    id: fill.tradeId.toString(),
                    isBuyerMaker: fill.otherUserId !== userId,//userID=bhavya ,otherUserID=srushti 
                    price: fill.price,
                    quantity: fill.quantity.toString(),
                    quoteqty: (fill.quantity * Number(fill.price)).toString(),
                    timestamp: Date.now(),
                    market
                }
            })
        })
    }
    updateDBOrders(order: Order, executedQty: number, fills: Fill[], market: string) {
        RedisManager.getInstance().pushMessage({
            type: ORDER_UPDATE,
            data: {
                orderId: order.orderId,
                executedQty,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
                market,
                side: order.side
            }
        })
        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: ORDER_UPDATE,
                data: {
                    orderId: fill.marketOrderId,
                    executedQty: fill.quantity,
                }
            })
        })
    }
    publishWsDepthUpdates(market: string, fills: Fill[], side: "buy" | "sell", price: string) {
        const orderbook = this.orderBooks.find(orderBook => orderBook.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        if (side == 'buy') {
            const updatedAsks = depth?.asks.filter(x => fills.map(y => y.price).includes(x[0].toString()));
            const updatedBids = depth?.bids.find(x => x[0] === price);
            RedisManager.getInstance().publishMessageForWs(`depth_${market}`, {
                stream: `depth_${market}`,
                data: {
                    asks: updatedAsks,
                    bids: updatedBids ? [updatedBids] : [],
                    e: "depth"
                }
            })
        }
        if (side == 'sell') {
            const updatedBids = depth?.bids.filter(x => fills.map(f => f.price).includes(x[0].toString()));
            const updatedAsks = depth?.asks.find(x => x[0] === price);
            RedisManager.getInstance().publishMessageForWs(`depth_${market}`, {
                stream: `depth_${market}`,
                data: {
                    asks: updatedAsks ? [updatedAsks] : [],
                    bids: updatedBids ,
                    e: "depth"
                }
            })
        }
    }
    publishWsTrades(fills:Fill[],userId:string,market:string){
        const orderbook = this.orderBooks.find(orderBook => orderBook.ticker() === market);
        if(!orderbook){
            return;
        }
        fills.map(fill=>{
            RedisManager.getInstance().publishMessageForWs(`trade@${market}`,{
                stream:`trade@${market}`,
                data:{
                    e:"trade",
                    p:fill.price,
                    q:fill.quantity.toString(),
                    t:fill.tradeId,
                    s:market,
                    m:fill.otherUserId!==userId
                }
            })
        })
    }
}