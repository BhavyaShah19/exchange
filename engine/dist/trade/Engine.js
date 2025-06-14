"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engine = exports.BASE_CURRENCY = void 0;
// this will be the main class where every business logic will be implemented and this class also publishes the events to the redis
const RedisManager_1 = require("../RedisManager");
const types_1 = require("../types");
const toAPI_1 = require("../types/toAPI");
const OrderBook_1 = require("./OrderBook");
exports.BASE_CURRENCY = "INR";
class Engine {
    constructor() {
        this.Balance = new Map();
        this.orderBooks = [];
        this.orderBooks = [new OrderBook_1.OrderBook("TATA", [], [], 0, 0)];
        this.setBalances();
    }
    process({ message, clientId }) {
        switch (message.type) {
            case toAPI_1.CREATE_ORDER:
                try {
                    const { fills, executedQty, orderId } = this.createOrder(message.data.market, message.data.side, message.data.quantity, message.data.price, message.data.userId);
                    RedisManager_1.RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_PLACED",
                        payload: {
                            orderId,
                            executedQty,
                            fills
                        }
                    });
                }
                catch (e) {
                    RedisManager_1.RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId: "",
                            executedQty: 0,
                            remaningQty: 0
                        }
                    });
                }
                break;
            case toAPI_1.CANCEL_ORDER:
                try {
                    const { orderId, market } = message.data;
                    const cancelOrderBook = this.orderBooks.find(orderBook => orderBook.ticker() === market);
                    const quote = market.split("_")[1];
                    const base = market.split("_")[0];
                    if (!cancelOrderBook) {
                        throw new Error("OrderBook not found");
                    }
                    const order = cancelOrderBook.asks.find(order => order.orderId === orderId) || cancelOrderBook.bids.find(order => order.orderId === orderId);
                    if (!order) {
                        throw new Error("Order not found");
                    }
                    if (order.side == "buy") {
                        const price = cancelOrderBook.cancelBid(order);
                        const leftQuantity = (order.quantity - order.filled) * order.price;
                        // @ts-ignore
                        //BTC_USDC base_asset_quoteAsset
                        this.Balance.get(order.userId)[base].available += leftQuantity;
                        // @ts-ignore
                        this.Balance.get(order.userId)[base].locked -= leftQuantity;
                        if (price) {
                            this.sendUpdatedDepthAt(price.toString(), market);
                        }
                    }
                    else {
                        const price = cancelOrderBook.cancelAsk(order);
                        const leftQuantity = (order.quantity - order.filled);
                        // @ts-ignore
                        this.Balance.get(order.userId)[quote].available += leftQuantity;
                        // @ts-ignore
                        this.Balance.get(order.userId)[quote].locked -= leftQuantity;
                        if (price) {
                            this.sendUpdatedDepthAt(price.toString(), market);
                        }
                    }
                    RedisManager_1.RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId,
                            executedQty: 0,
                            remaningQty: 0
                        }
                    });
                }
                catch (e) {
                    console.log("Error while cancelling order");
                    console.log(e);
                }
                break;
            case toAPI_1.GET_OPEN_ORDERS:
                try {
                    const openOrderBook = this.orderBooks.find(orderBook => orderBook.ticker() === message.data.market);
                    if (!openOrderBook) {
                        throw new Error("OrderBook not found");
                    }
                    const openOrders = openOrderBook.openOrders(message.data.userId);
                    RedisManager_1.RedisManager.getInstance().sendToApi(clientId, {
                        type: "OPEN_ORDERS",
                        payload: openOrders
                    });
                }
                catch (error) {
                    console.log(error);
                }
                break;
            case toAPI_1.GET_DEPTH:
                try {
                    const orderBook = this.orderBooks.find(orderBook => orderBook.ticker() === message.data.market);
                    if (!orderBook) {
                        throw new Error("OrderBook not found");
                    }
                    RedisManager_1.RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: orderBook.getDepth()
                    });
                }
                catch (error) {
                    console.log(error);
                    RedisManager_1.RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: {
                            bids: [],
                            asks: []
                        }
                    });
                }
                break;
            default:
                break;
        }
    }
    createOrder(market, side, quantity, price, userId) {
        const orderBook = this.orderBooks.find(orderBook => orderBook.ticker() === market);
        const baseAsset = market.split("_")[0];
        const quoteAsset = market.split("_")[1];
        if (!orderBook) {
            throw new Error("OrderBook not found");
        }
        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId, quantity, price);
        const order = {
            price: Number(price),
            quantity: Number(quantity),
            orderId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            filled: 0,
            side,
            userId
        };
        const { executedQty, fills } = orderBook.addOrder(order);
        this.updateBalance(baseAsset, quoteAsset, side, userId, executedQty, fills);
        this.createDBTrades(fills, userId, market);
        this.updateDBOrders(order, executedQty, fills, market);
        this.publishWsDepthUpdates(market, fills, side, price);
        this.publishWsTrades(fills, userId, market);
        return { fills, executedQty, orderId: order.orderId };
    }
    checkAndLockFunds(baseAsset, quoteAsset, side, userId, quantity, price) {
        if (side === "buy") {
            const userBalance = this.Balance.get(userId);
            if (!userBalance) {
                throw new Error("User not found");
            }
            const quoteBalance = userBalance[quoteAsset];
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
            const userBalance = this.Balance.get(userId);
            if (!userBalance) {
                throw new Error("User not found");
            }
            const baseBalance = userBalance[baseAsset];
            if (!baseBalance) {
                throw new Error("Base asset balance not found");
            }
            const requiredAmount = Number(quantity);
            if (requiredAmount > baseBalance.available) {
                throw new Error("Insufficient funds");
            }
        }
    }
    updateBalance(baseAsset, quoteAsset, side, userId, executedQty, fills) {
        //jo side buy hoy quoteAsset ochu thase ane baseAsset vadhse
        // ane same vada nu quote vadhse ane base ochu thase.
        if (side === "buy") {
            fills.forEach(fill => {
                var _a, _b, _c, _d;
                // @ts-ignore
                console.log("Earlier balance for the otheruser" + fill.otherUserId + " is:" + (this.Balance.get(fill.otherUserId)[quoteAsset].available));
                // @ts-ignore
                this.Balance.get(fill.otherUserId)[quoteAsset].available += Number(fill.quantity) * Number(fill.price);
                // @ts-ignore
                console.log("after buying balance for the otheruser" + fill.otherUserId + " is:" + (this.Balance.get(fill.otherUserId)[quoteAsset].available));
                // @ts-ignore
                (_b = (_a = this.Balance) === null || _a === void 0 ? void 0 : _a.get(userId)) === null || _b === void 0 ? void 0 : _b[quoteAsset].locked -= Number(fill.quantity) * Number(fill.price);
                // @ts-ignore
                this.Balance.get(fill.otherUserId)[baseAsset].locked -= Number(fill.quantity);
                // @ts-ignore
                (_d = (_c = this.Balance) === null || _c === void 0 ? void 0 : _c.get(userId)) === null || _d === void 0 ? void 0 : _d[baseAsset].available += Number(fill.quantity);
            });
        }
        else {
            fills.forEach(fill => {
                var _a, _b, _c, _d;
                //@ts-ignore
                this.Balance.get(fill.otherUserId)[quoteAsset].locked = ((_a = this.Balance.get(fill.otherUserId)) === null || _a === void 0 ? void 0 : _a[quoteAsset].locked) - (fill.quantity * fill.price);
                //@ts-ignore
                this.Balance.get(userId)[quoteAsset].available = ((_b = this.Balance.get(userId)) === null || _b === void 0 ? void 0 : _b[quoteAsset].available) + (fill.quantity * fill.price);
                //@ts-ignore
                this.Balance.get(fill.otherUserId)[baseAsset].available = ((_c = this.Balance.get(fill.otherUserId)) === null || _c === void 0 ? void 0 : _c[baseAsset].available) + fill.quantity;
                //@ts-ignore
                this.Balance.get(userId)[baseAsset].locked = ((_d = this.Balance.get(userId)) === null || _d === void 0 ? void 0 : _d[baseAsset].locked) - (fill.quantity);
            });
        }
    }
    createDBTrades(fills, userId, market) {
        fills.forEach(fill => {
            RedisManager_1.RedisManager.getInstance().pushMessage({
                type: types_1.TRADE_ADDED,
                data: {
                    id: fill.tradeId.toString(),
                    isBuyerMaker: fill.otherUserId !== userId, //userID=bhavya ,otherUserID=srushti 
                    price: fill.price,
                    quantity: fill.quantity.toString(),
                    quoteqty: (fill.quantity * Number(fill.price)).toString(),
                    timestamp: Date.now(),
                    market
                }
            });
        });
    }
    updateDBOrders(order, executedQty, fills, market) {
        RedisManager_1.RedisManager.getInstance().pushMessage({
            type: types_1.ORDER_UPDATE,
            data: {
                orderId: order.orderId,
                executedQty,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
                market,
                side: order.side
            }
        });
        fills.forEach(fill => {
            RedisManager_1.RedisManager.getInstance().pushMessage({
                type: types_1.ORDER_UPDATE,
                data: {
                    orderId: fill.marketOrderId,
                    executedQty: fill.quantity,
                }
            });
        });
    }
    publishWsDepthUpdates(market, fills, side, price) {
        const orderbook = this.orderBooks.find(orderBook => orderBook.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        if (side == 'buy') {
            const updatedAsks = depth === null || depth === void 0 ? void 0 : depth.asks.filter(x => fills.map(y => y.price).includes(x[0].toString()));
            console.log("publish ws depth asks ", updatedAsks);
            const updatedBids = depth === null || depth === void 0 ? void 0 : depth.bids.find(x => x[0] === price);
            console.log("publish ws depth asks ", updatedBids);
            RedisManager_1.RedisManager.getInstance().publishMessageForWs(`depth_${market}`, {
                stream: `depth_${market}`,
                data: {
                    asks: updatedAsks,
                    bids: updatedBids ? [updatedBids] : [],
                    e: "depth"
                }
            });
        }
        if (side == 'sell') {
            const updatedBids = depth === null || depth === void 0 ? void 0 : depth.bids.filter(x => fills.map(f => f.price).includes(x[0].toString()));
            const updatedAsks = depth === null || depth === void 0 ? void 0 : depth.asks.find(x => x[0] === price);
            console.log("publish ws depth updates");
            RedisManager_1.RedisManager.getInstance().publishMessageForWs(`depth_${market}`, {
                stream: `depth_${market}`,
                data: {
                    asks: updatedAsks ? [updatedAsks] : [],
                    bids: updatedBids,
                    e: "depth"
                }
            });
        }
    }
    publishWsTrades(fills, userId, market) {
        const orderbook = this.orderBooks.find(orderBook => orderBook.ticker() === market);
        if (!orderbook) {
            return;
        }
        fills.map(fill => {
            RedisManager_1.RedisManager.getInstance().publishMessageForWs(`trade@${market}`, {
                stream: `trade@${market}`,
                data: {
                    e: "trade",
                    p: fill.price,
                    q: fill.quantity.toString(),
                    t: fill.tradeId,
                    s: market,
                    m: fill.otherUserId !== userId
                }
            });
        });
    }
    sendUpdatedDepthAt(price, market) {
        const orderbook = this.orderBooks.find(orderBook => orderBook.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        const updatedBids = depth.bids.filter(x => x[0] === price);
        const updatedAsks = depth.asks.filter(x => x[0] === price);
        RedisManager_1.RedisManager.getInstance().publishMessageForWs(`depth_${market}`, {
            stream: `depth_${market}`,
            data: {
                asks: updatedAsks.length ? updatedAsks : [[price, "0"]],
                bids: updatedBids.length ? updatedBids : [[price, "0"]],
                e: "depth"
            }
        });
    }
    setBalances() {
        this.Balance.set("1", {
            [exports.BASE_CURRENCY]: {
                available: 1000000,
                locked: 0
            },
            ["TATA"]: {
                available: 5,
                locked: 0
            }
        });
        this.Balance.set("2", {
            [exports.BASE_CURRENCY]: {
                available: 2000000,
                locked: 0
            },
            ["TATA"]: {
                available: 10,
                locked: 0
            }
        });
        this.Balance.set("5", {
            [exports.BASE_CURRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });
    }
}
exports.Engine = Engine;
