import { Request, Response } from "express";
import { deleteLead } from "../leads";

export default async function handler(req: Request, res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "POST") {
    return deleteLead(req, res);
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
