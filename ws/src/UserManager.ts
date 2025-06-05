import { SubscriptionsManager } from "./SubscriptionsManager";
import { User } from "./User";
import { WebSocket } from "ws";
export class UserManager {
    private static instance: UserManager;
    private users: Map<string, User>=new Map();
    private constructor() {
    }
    public static getInstance(): UserManager {
        if (!this.instance) {
            this.instance = new UserManager();
        }
        return this.instance;
    }
    public addUser(ws: WebSocket) {
        const id=this.getRandomId();
        const user = new User(id, ws);
        this.users.set(id, user);
        this.registerOnClose(ws,id);
        return user;
    }
    private registerOnClose(ws:WebSocket,userId:string){
        ws.on("close",()=>{
            this.users.delete(userId);
            SubscriptionsManager.getInstance().userLeft(userId);
        })
    }
    getRandomId(){
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    public getUser(id:string){
        return this.users.get(id);
    }
}