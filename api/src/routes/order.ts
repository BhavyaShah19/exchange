import { Router } from "express";

export const orderBook=Router();

orderBook.post("/",async (req,res)=>{
  const {market,quantity,price,side,userId}=req.body(); 
  
});