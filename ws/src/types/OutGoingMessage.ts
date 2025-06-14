export type TickerUpdateMessage = {
    type: "ticker",
    data: {
        c?: string,
        h?: string,
        l?: string,
        v?: string,
        V?: string,
        s?: string,
        id: number,
        e: "ticker"
    }
} 

export type DepthUpdateMessage = {
    type: "depth",
    data: {
        b?: [string, string][],
        a?: [string, string][],
        id: number,
        e: "depth"
    }
}

export type TradeAddedMessage={
    type:"trade",
    data:{
        i:number,//id
        p:string,//price
        q:string,//quantity
        t:number//timestamp
        s:string,//symbol
        m:boolean,//isBuyerMaker 
        e:"trade",//event type
    }

}


export type OutgoingMessage = TickerUpdateMessage | DepthUpdateMessage | TradeAddedMessage;