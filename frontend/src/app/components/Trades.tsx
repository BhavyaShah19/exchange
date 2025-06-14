"use client"

import { SignalingManager } from "@/utils/SignalingManager";
import { getTrades } from "@/utils/httpClient";
import { Trade } from "@/utils/types"
import moment from "moment";
import { useEffect, useState } from "react";

export default function Trades({ market }: { market: string }) {
    const [trades, setTrades] = useState<Trade[]>();
    useEffect(() => {
        getTrades(market).then(t => setTrades(t));
        SignalingManager.getInstance().registerCallback("trade", (data: Partial<Trade>) => {
            if (data) {
                let newTrade: Trade = {
                    id: data.id ? data.id : 0,
                    isBuyerMaker: data.isBuyerMaker ? data.isBuyerMaker : false,
                    price: data.price ? data.price : "",
                    quantity: data.quantity ? data.quantity : "",
                    quoteQuantity: data.quoteQuantity ? data.quoteQuantity : "",
                    timestamp: data.timestamp ? data.timestamp : 0,
                }
                setTrades((prev) => (prev && data ? [newTrade, ...prev] : [newTrade])); 
        }
      },
      `TRADE-${market}`
    );
    SignalingManager.getInstance().sendMessage({ method: "SUBSCRIBE", params: [`trade@${market}`] });
    return () => {
        SignalingManager.getInstance().deRegisterCallback("trade", `TRADE-${market}`);
        SignalingManager.getInstance().sendMessage({ method: "UNSUBSCRIBE", params: [`trade@${market}`] });
    }
}, [market])

return (
    <div>
    <TableHeader />
      <div className="flex flex-col justify-between">
        {trades?.slice(0, 25)?.map((data) => {
          return (
            <TradesTable
              key={data.id}
              price={data.price}
              quantity={data.quantity}
              timestamp={data.timestamp}
            />
          );
        })}
      </div>
    </div>
)
}

function TableHeader() {
    return <div className="absolute top-0 left-0 w-full h-5 flex justify-between text-xs bg-black z-10">
        <div className="text-white">Price</div>
        <div className="text-slate-500">Qunatity</div>
        <div className="text-slate-500">Time</div>
    </div>
}

function TradesTable({
    price,
    quantity,
    timestamp,
  }: {
    price: string;
    quantity: string;
    timestamp: number;
  }) {
    return (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          backgroundColor: "transparent",
          overflow: "hidden",
        }}
      >
        <div className={`flex justify-between text-xs w-full`}>
          <div className="text-[#04945f] font-normal">{price}</div>
          <div className="text-[#d3d3d4]">{quantity}</div>
          <div className="text-[#848c9b]">
            {moment(timestamp).format("hh:mm:ss")}
          </div>
        </div>
      </div>
    );
  }