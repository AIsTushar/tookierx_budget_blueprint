import express from "express";
import { webHookService } from "./webhook.Service";

const router = express.Router();

// Stripe requires raw body
router.post("/", express.raw({ type: "application/json" }), webHookService);

export const webhookRouter = router;
