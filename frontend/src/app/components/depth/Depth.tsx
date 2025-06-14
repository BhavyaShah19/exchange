"use client"
import { getDepth, getTicker, getTrades } from "@/utils/httpClient"
import { useEffect, useState } from "react"
import { Asks } from "./Asks"
import { Bids } from "./Bids"
import { SignalingManager } from "@/utils/SignalingManager"
import { Depth, Trade } from "@/utils/types"


export default function Depth({ market }: { market: string }) {
    const [asks, setAsks] = useState<[string, string][]>([])
    const [bids, setBids] = useState<[string, string][]>([])
    const [price, setPrice] = useState<string>('')
    
    useEffect(() => {
        console.log("Setting up depth callback for market:", market);
        SignalingManager.getInstance().registerCallback("depth", (data: Depth) => {
            console.log("Raw data received in depth callback:", data);
            console.log("Data type:", typeof data);
            console.log("Data structure:", JSON.stringify(data, null, 2));

            if (!data) {
                console.warn("Received undefined data in depth callback");
                return;
            }

            setBids((originalBids) => {
                console.log("Original bids:", originalBids);
                console.log("New bids data:", data.bids);
                if (data?.bids === undefined) {
                    console.log("No bids in data thus returning");
                    return originalBids || [];
                }
                if (data.bids.length === 0) {
                    console.log("Empty bids array received");
                    return [];
                }
                const bidsAfterUpdate = [...(originalBids || [])];

                for (let i = 0; i < bidsAfterUpdate.length; i++) {
                    for (let j = 0; j < data.bids.length; j++) {
                        if (bidsAfterUpdate[i][0] === data.bids[j][0]) {
                            bidsAfterUpdate[i][1] = data.bids[j][1];
                            if (Number(bidsAfterUpdate[i][1]) === 0) {
                                bidsAfterUpdate.splice(i, 1);
                            }
                            break;
                        }
                    }
                }
                for (let j = 0; j < data.bids.length; j++) {
                    if (Number(data.bids[j][1]) !== 0 && !bidsAfterUpdate.map(x => x[0]).includes(data.bids[j][0])) {
                        bidsAfterUpdate.push(data.bids[j]);
                        break;
                    }
                }
                bidsAfterUpdate.sort((x, y) => Number(y[0]) > Number(x[0]) ? -1 : 1);
                return bidsAfterUpdate;
            });

            setAsks((originalAsks) => {
                console.log("Original asks:", originalAsks);
                console.log("New asks data:", data.asks);
                if (data?.asks === undefined) {
                    console.log("No asks in data");
                    return originalAsks || [];
                }
                if (data.asks.length === 0) {
                    console.log("Empty asks array received");
                    return [];
                }
                const asksAfterUpdate = [...(originalAsks || [])];

                for (let i = 0; i < asksAfterUpdate.length; i++) {
                    for (let j = 0; j < data.asks.length; j++) {
                        if (asksAfterUpdate[i][0] === data.asks[j][0]) {
                            asksAfterUpdate[i][1] = data.asks[j][1];
                            if (Number(asksAfterUpdate[i][1]) === 0) {
                                asksAfterUpdate.splice(i, 1);
                            }
                            break;
                        }
                    }
                }
                for (let j = 0; j < data.asks.length; j++) {
                    if (Number(data.asks[j][1]) !== 0 && !asksAfterUpdate.map(x => x[0]).includes(data.asks[j][0])) {
                        asksAfterUpdate.push(data.asks[j]);
                        break;
                    }
                }
                asksAfterUpdate.sort((x, y) => Number(y[0]) > Number(x[0]) ? 1 : -1);
                return asksAfterUpdate;
            });
        }, `DEPTH-${market}`);   
        console.log("Sending subscribe message for market:", market);
        SignalingManager.getInstance().sendMessage({
            "method": "SUBSCRIBE",
            "params": [`depth_${market}`]
        });

        getDepth(market).then(d => {
            setBids(d.bids.reverse());
            setAsks(d.asks);
        });

        getTicker(market).then(t => setPrice(t.lastPrice));
        getTrades(market).then(t => setPrice(t[0].price));
        return () => {
            SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${market}`)
            SignalingManager.getInstance().sendMessage({ "method": "UNSUBSCRIBE", "params": [`depth_${market}`] })
        }
    }, [market])

    return <div className="relative mt-6">
        <TableHeader />
        <div className="h-[500px] relative overflow-y-scroll no-scrollbar">
            {asks && <Asks asks={asks} />}
            {price && <div>{price}</div>}
            {bids && <Bids bids={bids} />}
        </div>
    </div>
}

function TableHeader() {
    return <div className="flex justify-between text-xs">
    <div className="text-white">Price</div>
    <div className="text-slate-500">Size</div>
    <div className="text-slate-500">Total</div>
</div>
}
