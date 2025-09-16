/**
 * Authored by: Cascade using Gemini 2.5 Pro
 * Date: 2025-09-15T20:50:56-04:00
 * PURPOSE: Simplified routes for LLM winner detection pipeline
 * Only includes the LLM analysis endpoint we actually need
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { handleLLMAnalysisRequest } from "./llm-analysis-endpoint";

export async function registerRoutes(app: Express): Promise<Server> {
  // LLM Analysis endpoint - triggers winner detection and PlayFab upload
  app.post("/api/llm-analysis", handleLLMAnalysisRequest);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
