"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBook = exports.BASE_CURRENCY = void 0;
exports.BASE_CURRENCY = "INR";
class OrderBook {
    constructor(baseAsset, bids, asks, lastTradeId, currentPrice) {
        this.quoteAsset = exports.BASE_CURRENCY;
        this.baseAsset = baseAsset;
        this.bids = bids;
        this.asks = asks;
        this.lastTradeId = lastTradeId || 0;
        this.currentPrice = currentPrice || 0;
    }
    ticker() {
        return `${this.baseAsset}_${this.quoteAsset}`;
    }
    addOrder(order) {
        if (order.side === "buy") {
            const { executedQty, fills } = this.matchBids(order);
            order.filled = executedQty;
            if (executedQty === order.quantity) {
                return {
                    executedQty,
                    fills
                };
            }
            this.bids.push(order);
            return {
                executedQty,
                fills
            };
        }
        else {
            const { executedQty, fills } = this.matchAsks(order);
            order.filled = executedQty;
            if (executedQty === order.quantity) {
                return {
                    executedQty,
                    fills
                };
            }
            this.asks.push(order);
            return { executedQty, fills };
        }
    }
    matchBids(order) {
        let bidPrice = order.price;
        let bidQuantity = order.quantity;
        let executedQty = 0;
        const fills = [];
        // this.asks.sort((a, b) => a.price - b.price);
        for (let i = 0; i < this.asks.length; i++) {
            if (this.asks[i].price <= bidPrice && executedQty < bidQuantity) {
                const filledQty = Math.min(this.asks[i].quantity, bidQuantity - executedQty);
                executedQty += filledQty;
                this.asks[i].filled += filledQty;
                fills.push({
                    price: this.asks[i].price.toString(),
                    quantity: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.asks[i].userId,
                    marketOrderId: this.asks[i].orderId
                });
            }
        }
        for (let i = 0; i < this.asks.length; i++) {
            if (this.asks[i].filled === this.asks[i].quantity) {
                this.asks.splice(i, 1);
                i--;
            }
        }
        return { executedQty, fills };
    }
    matchAsks(order) {
        let executedQty = 0;
        const fills = [];
        for (let i = 0; i < this.bids.length; i++) {
            if (this.bids[i].price >= order.price && executedQty < order.quantity) {
                const amountRemaining = Math.min(order.quantity - executedQty, this.bids[i].quantity);
                executedQty += amountRemaining;
                this.bids[i].filled += amountRemaining;
                fills.push({
                    price: this.bids[i].price.toString(),
                    quantity: amountRemaining,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.bids[i].userId,
                    marketOrderId: this.bids[i].orderId
                });
            }
        }
        for (let i = 0; i < this.bids.length; i++) {
            if (this.bids[i].filled === this.bids[i].quantity) {
                this.bids.splice(i, 1);
                i--;
            }
        }
        return { executedQty, fills };
    }
    getDepth() {
        const bids = [];
        const asks = [];
        const sameAmountBidCameAfterwards = {};
        const sameAmountAskCameAfterwards = {};
        for (let i = 0; i < this.bids.length; i++) {
            if (!sameAmountBidCameAfterwards[this.bids[i].price]) {
                sameAmountBidCameAfterwards[this.bids[i].price] = 0;
            }
            sameAmountBidCameAfterwards[this.bids[i].price] += this.bids[i].quantity;
        }
        for (let i = 0; i < this.asks.length; i++) {
            if (!sameAmountAskCameAfterwards[this.asks[i].price]) {
                sameAmountAskCameAfterwards[this.asks[i].price] = 0;
            }
            sameAmountAskCameAfterwards[this.asks[i].price] += this.asks[i].quantity;
        }
        for (const price in sameAmountBidCameAfterwards) {
            bids.push([price, sameAmountBidCameAfterwards[price].toString()]);
        }
        for (const price in sameAmountAskCameAfterwards) {
            asks.push([price, sameAmountAskCameAfterwards[price].toString()]);
        }
        return { bids, asks };
    }
    cancelBid(order) {
        const index = this.bids.findIndex(bid => bid.orderId === order.orderId);
        if (index === -1) {
            throw new Error("Order not found");
        }
        this.bids.splice(index, 1);
        return order.price;
    }
    cancelAsk(order) {
        const index = this.asks.findIndex(ask => ask.orderId === order.orderId);
        if (index === -1) {
            throw new Error("Order not found");
        }
        this.asks.splice(index, 1);
        return order.price;
    }
    openOrders(userId) {
        const bids = this.bids.filter(x => x.userId === userId);
        const asks = this.asks.filter(x => x.userId === userId);
        return [...bids, ...asks];
    }
}
exports.OrderBook = OrderBook;
