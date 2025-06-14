import { WebSocket } from "ws";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/IncomingMessage";
import { SubscriptionsManager } from "./SubscriptionsManager";
import { OutgoingMessage } from "./types/OutGoingMessage";
export class User {
    private id: string;
    private ws: WebSocket;
    constructor(id: string, ws: WebSocket) {
        this.id = id;
        this.ws = ws;
        this.addListeners();
    }
    private addListeners(){
        this.ws.on("message",(message:string)=>{
            console.log("Message came from user",message)
            const parsedMessage:IncomingMessage=JSON.parse(message);
            if(parsedMessage.method===SUBSCRIBE){
                parsedMessage.params.forEach(s=>SubscriptionsManager.getInstance().subscribe(this.id,s));
            }
            if(parsedMessage.method===UNSUBSCRIBE){
                parsedMessage.params.forEach(s=>SubscriptionsManager.getInstance().unSubscribe(this.id,s));
            }
        });
    }
    emit(message:OutgoingMessage){
        this.ws.send(JSON.stringify(message));
        console.log("emitted the message from emit",message)
    }
}
