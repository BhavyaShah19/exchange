import { getDepth, getTicker, getTrades } from "@/utils/httpClient"
import { useEffect, useState } from "react"
import {Asks} from "./Asks"
import {Bids} from "./Bids"
import { SignalingManager } from "@/utils/SignalingManager"


export default function DepthPage({market}:{market:string}) {
    const [asks, setAsks] = useState<[string, string][]>([])
    const [bids, setBids] = useState<[string, string][]>([])
    const [price, setPrice] = useState<string>() 
    useEffect(() => {
        SignalingManager.getInstance().registerCallback("depth", (data: any) => {
            
            setBids((originalBids) => {
                const bidsAfterUpdate = [...(originalBids || [])];

                for (let i = 0; i < bidsAfterUpdate.length; i++) {
                    for (let j = 0; j < data.bids.length; j++)  {
                        if (bidsAfterUpdate[i][0] === data.bids[j][0]) {
                            bidsAfterUpdate[i][1] = data.bids[j][1];
                            if (Number(bidsAfterUpdate[i][1]) === 0) {  
                                bidsAfterUpdate.splice(i, 1);  
                            }
                            break;
                        }
                    }
                }
                return bidsAfterUpdate; 
            });

            setAsks((originalAsks) => {
                const asksAfterUpdate = [...(originalAsks || [])];

                for (let i = 0; i < asksAfterUpdate.length; i++) {
                    for (let j = 0; j < data.asks.length; j++)  {
                        if (asksAfterUpdate[i][0] === data.asks[j][0] ) {
                            asksAfterUpdate[i][1] = data.asks[j][1];
                            if (Number(asksAfterUpdate[i][1]) === 0) {  
                                asksAfterUpdate.splice(i, 1);  
                            }
                            break;
                        }
                    }
                }
                return asksAfterUpdate; 
            });
        }, `DEPTH-${market}`);
        SignalingManager.getInstance().sendMessage({"method":"SUBSCRIBE","params":[`depth.200ms.${market}`]})
        return () => {
            SignalingManager.getInstance().deRegisterCallback("depth",`DEPTH-${market}`)
            SignalingManager.getInstance().sendMessage({"method":"UNSUBSCRIBE","params":[`depth.200ms.${market}`]})
        }
        // getDepth(market).then(d=>{
        //     setAsks(d.asks)
        //     setBids(d.bids)
        // })
        // getTicker(market).then(t=>setPrice(t.lastPrice))
        // getTrades(market).then(t=>{setPrice(t[0].price)})
    
    }, [])
    
    return (
        <div>
            {/* I have to render asks and bids logic here as a different component */}
            <TableHeader />
            <Asks asks={asks} />
            {price && <div>{price}</div>}

            <Bids bids={bids} />
        </div>
    )
}

function TableHeader() {
    return (
        <div className="flex justify-between">
            <div className="text-sm text-gray-500">Price(USD)</div>
            <div className="text-sm text-gray-500">Size</div>
            <div className="text-sm text-gray-500">Total</div>
        </div>
    )
}

