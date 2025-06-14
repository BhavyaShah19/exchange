"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderBook = void 0;
const express_1 = require("express");
const RedisManager_1 = require("../RedisManager");
const types_1 = require("../types");
exports.orderBook = (0, express_1.Router)();
exports.orderBook.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Full request body:", req.body);
    console.log("Request headers:", req.headers);
    console.log("Content-Type:", req.headers['content-type']);
    const { market, quantity, price, side, userId } = req.body;
    console.log("Destructured values:", { market, quantity, price, side, userId });
    const response = yield RedisManager_1.RedisManager.getInstance().sendAndAwait({
        type: types_1.CREATE_ORDER,
        data: {
            market,
            quantity,
            price,
            side,
            userId
        }
    });
    res.send(response.payload);
}));
exports.orderBook.delete("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { market, orderId } = req.body;
    const response = yield RedisManager_1.RedisManager.getInstance().sendAndAwait({
        type: types_1.CANCEL_ORDER,
        data: {
            orderId,
            market
        }
    });
    res.send(response.payload);
}));
exports.orderBook.get("/open", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield RedisManager_1.RedisManager.getInstance().sendAndAwait({
        type: types_1.GET_OPEN_ORDERS,
        data: {
            userId: req.query.userId,
            market: req.query.market
        }
    });
    res.send(response.payload);
}));
