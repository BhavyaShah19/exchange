export type DepthUpdate={
    stream:string,
    data:{
        asks:[string,string][],
        bids:[string,string][],
        e:"depth",
    }
}
export type TradeAddedMessage={
    stream:string,
    data:{
        e:"trade",//event type
        p:string,//price
        q:string,//quantity
        t:number//tradeId
        s:string,//symbol
        m:boolean,//isBuyerMaker 
    }

}

export type wsMessage=DepthUpdate | TradeAddedMessage;

