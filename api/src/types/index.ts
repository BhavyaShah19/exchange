export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";
export const GET_DEPTH = "GET_DEPTH";

export type MessageFromEngine = {
    type: "ORDER_PLACED",
    payload: {
        orderId: string,
        executedQty: number,
        fills: [
            {
                price: string,
                quantity: number,
                tradeId: number
            }
        ]
    }
}|{
    type: "ORDER_CANCELLED",
    payload:{        
        orderId:string,
        executedQty:number,
        remaningQty:number
    }
}|{
    type: "OPEN_ORDERS",
    payload: {
        orderId: string,
        executedQty: number,
        price: string,
        quantity: string,
        side: "buy" | "sell",
        userId: string
    }[]
}




