import { Ticker } from './types';
// To create singleton class

const BASE__URL = "wss://ws.backpack.exchange/";
export class SignalingManager {
    private static instance: SignalingManager;
    private ws: WebSocket;
    private bufferdMessages: string[];
    private callbacks: { [type: string]: any[] } = {}
    private isInstanced: boolean = false;
    private id: number;

    private constructor() {
        this.ws = new WebSocket(BASE__URL);
        this.bufferdMessages = [];
        this.id = 1;
        console.log("inside construciot")
        this.init();
    }

    init() {
        this.ws.onopen = () => {
            this.isInstanced = true;
            this.bufferdMessages.forEach(message => {
                this.ws.send(message);
            })
            this.bufferdMessages = [];
        }
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const type = message.data.e
            if (this.callbacks[type]) {
                // for each callback
                this.callbacks[type].forEach(({ callback }) => {
                    if (type === "bookTicker") {
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
                    if(type === "depth"){
                        const updatedBids=message.data.b
                        const updatedAsks=message.data.a
                        callback({
                            bids:updatedBids,
                            asks:updatedAsks,
                        })
                    }
                })
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
            this.bufferdMessages.push(messageToSend);
        } else {
            this.ws.send(messageToSend);
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
