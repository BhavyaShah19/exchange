import { Kline, Ticker } from "./types"
import axios from "axios";

const BASE__URL="https://api.binance.com/api/v1"

export async function getTicker(market:string) {
    const response = await getTickers();
    const ticker=response.find(item=>item.symbol===market);
    if(!ticker){
        throw new Error("Ticker not found");
    }
    return ticker;
}

export async function getTickers():Promise<Ticker[]> {
    const response = await axios.get(`${BASE__URL}/tickers`)  
    return response.data();
}

export async function getDepth(market:string) {
    const response = await axios.get(`${BASE__URL}/depth?symbol=${market}`)
    return response.data;
}

export async function getTrades(market:string) {
    const response = await axios.get(`${BASE__URL}/trades?symbol=${market}`)
    return response.data;
}

export async function getKlines(market:string, interval:string, startTime:number, endTime:number) {
    const response = await axios.get(`${BASE__URL}/klines?market=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`)
    const data:Kline[] = response.data;
    return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
}