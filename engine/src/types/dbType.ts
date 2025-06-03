import { TRADE_ADDED ,ORDER_UPDATE} from "./index";
export type DbMessage = {
    type:typeof TRADE_ADDED,
    data:{
        id:string,
        isBuyerMaker:boolean,
        price:string,
        quantity:string,
        quoteqty:string,
        timestamp:number,
        market:string,
    }
}|{
    type:typeof ORDER_UPDATE,
    data:{
        orderId:string,
        executedQty:number,
        price?:string,
        quantity?:string,
        market?:string,
        side?:"buy"|"sell"
    }
}