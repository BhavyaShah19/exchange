import { SignalingManager } from "@/utils/SignalingManager"
import { getTicker } from "@/utils/httpClient"
import { Ticker } from "@/utils/types"
import { useEffect, useState } from "react"

export default function MarketBar({market}:{market:string}) {
    const [ticker, setTicker] = useState<Ticker | null>(null)
    useEffect(() => {
        getTicker(market).then(setTicker)
        SignalingManager.getInstance().registerCallback("bookTicker", (data: Partial<Ticker>)  =>  setTicker(prevTicker => ({
            firstPrice: data?.firstPrice ?? prevTicker?.firstPrice ?? '',
            high: data?.high ?? prevTicker?.high ?? '',
            lastPrice: data?.lastPrice ?? prevTicker?.lastPrice ?? '',
            low: data?.low ?? prevTicker?.low ?? '',
            priceChange: data?.priceChange ?? prevTicker?.priceChange ?? '',
            priceChangePercent: data?.priceChangePercent ?? prevTicker?.priceChangePercent ?? '',
            quoteVolume: data?.quoteVolume ?? prevTicker?.quoteVolume ?? '',
            symbol: data?.symbol ?? prevTicker?.symbol ?? '',
            trades: data?.trades ?? prevTicker?.trades ?? '',
            volume: data?.volume ?? prevTicker?.volume ?? '',
        })), `TICKER-${market}`);
        SignalingManager.getInstance().sendMessage({"method":"SUBSCRIBE","params":[`bookTicker.${market}`]})     
        return () => {
            SignalingManager.getInstance().deRegisterCallback("bookTicker", `TICKER-${market}`)
            SignalingManager.getInstance().sendMessage({"method":"UNSUBSCRIBE","params":[`bookTicker.${market}`]})     
        }
    }, [market])
    return (
        <div>
            
           
        </div>
    )
}