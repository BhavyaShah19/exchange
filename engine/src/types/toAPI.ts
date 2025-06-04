import { Order } from "../trade/OrderBook";

export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";
export const GET_DEPTH = "GET_DEPTH";

export type toAPI = {
    type:"DEPTH",
    payload:{
        bids:[string,string][],
        asks:[string,string][]
    }
} | {
    type: "ORDER_PLACED",
    payload: {
        orderId: string,
        executedQty: number,
        fills:
        {
            price: string,
            quantity: number,
            tradeId: number
        }[]
    }
} | {
    type: "ORDER_CANCELLED",
    payload: {
        orderId: string,
        executedQty: number,
        remaningQty: number
    }
} | {
    type: "OPEN_ORDERS",
    payload: Order[]
}




