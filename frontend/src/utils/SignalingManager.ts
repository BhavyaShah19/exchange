import { Ticker, Trade } from './types';
// To create singleton class

export const BASE_URL = "ws://localhost:3001"

export class SignalingManager {
    private static instance: SignalingManager;
    private ws: WebSocket;
    private bufferdMessages: string[];
    private callbacks: { [type: string]: any[] } = {}
    private isInstanced: boolean = false;
    private id: number;

    private constructor() {
        this.ws = new WebSocket(BASE_URL);
        this.bufferdMessages = [];
        this.id = 1;
        this.init();
    }

    init() {
        this.ws.onopen = () => {
            console.log("WebSocket connected");
            this.isInstanced = true;
            this.bufferdMessages.forEach(message => {
                this.ws.send(message);
            })
            this.bufferdMessages = [];
        }
        this.ws.onmessage = (event) => {
            try {
                console.log("Raw WebSocket message:", event.data);
                const message = JSON.parse(event.data);
                console.log("Parsed WebSocket message:", message);

                const type = message.data?.e;
                console.log("Message type:", type);
                console.log("Available callbacks:", Object.keys(this.callbacks));

                if (this.callbacks[type]) {
                    console.log(`Found ${this.callbacks[type].length} callbacks for type ${type}`);
                    this.callbacks[type].forEach(({ callback, id }) => {
                        console.log(`Executing callback for id: ${id}`);
                        if (type === "trade") {
                            const newTrade: Partial<Trade> = {
                                id:message.data.i,
                                price: message.data.p,
                                quantity: message.data.q,
                                timestamp: message.data.t,
                                isBuyerMaker: message.data.m,   
                            }
                            callback(newTrade)
                        }
                        if (type === "ticker") {
                            const newTicker: Partial<Ticker> = {
                                lastPrice: message.data.c,
                                high: message.data.h,
                                low: message.data.l,
                                volume: message.data.v,
                                quoteVolume: message.data.V,
                                symbol: message.data.s,
                            }
                            callback(newTicker)
                        }
                        if (type === "depth") {
                            console.log("Processing depth update:", message.data);
                            const updatedBids = message.data.bids;
                            const updatedAsks = message.data.asks;
                            console.log("Depth data - Bids:", updatedBids);
                            console.log("Depth data - Asks:", updatedAsks);

                            callback({
                                bids: updatedBids,
                                asks: updatedAsks,
                            })
                        }
                    })
                } else {
                    console.warn(`No callbacks found for type: ${type}`);
                }
            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        }
    }
    public static getInstance(): SignalingManager {
        if (!this.instance) {
            this.instance = new SignalingManager();
        }
        return this.instance;
    }


    sendMessage(message: any) {
        const messageToSend = {
            ...message,
            id: this.id++,
        }
        if (!this.isInstanced) {
            this.bufferdMessages.push(JSON.stringify(messageToSend));
        } else {
            this.ws.send(JSON.stringify(messageToSend));
        }
    }

    async registerCallback(type: string, callback: any, id: string) {
        this.callbacks[type] = this.callbacks[type] || [];
        this.callbacks[type].push({ callback, id });
    }

    async deRegisterCallback(type: string, id: string) {
        if (this.callbacks[type]) {
            const index = this.callbacks[type].findIndex(item => item.id === id);
            if (index !== -1) {
                this.callbacks[type].splice(index, 1);
            }
        }
    }

}
