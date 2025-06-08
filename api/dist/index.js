"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const order_1 = require("./routes/order");
const kline_1 = require("./routes/kline");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/api/v1/order", order_1.orderBook);
app.use("/api/v1/klines", kline_1.klineRouter);
app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});
