
import { GoogleGenAI, Type } from "@google/genai";
import { AnomalyAlert, TrafficPacket } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeThreat(alerts: AnomalyAlert[], recentTraffic: TrafficPacket[]) {
    const prompt = `
      You are an expert Cybersecurity Analyst for the NADS (Network Anomaly Detection System).
      
      I have detected the following recent anomalies and traffic patterns:
      Alerts: ${JSON.stringify(alerts.slice(0, 5))}
      Traffic Context: ${JSON.stringify(recentTraffic.slice(0, 10))}

      Based on this data, provide:
      1. A summary of the current security posture.
      2. Specific recommendations for the Network Administrator.
      3. An assessment of whether these anomalies could be a coordinated attack.
      
      Keep the tone professional and technical.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are a senior cybersecurity engineer specializing in behavioral network anomaly detection.",
          temperature: 0.7,
        }
      });

      return response.text || "Unable to generate analysis at this time.";
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "An error occurred while analyzing the security data.";
    }
  }

  async getAnomalyExplanation(anomalyType: string) {
    const prompt = `Explain the network security threat known as "${anomalyType}" in the context of behavioral anomaly detection. Suggest one mitigation strategy.`;
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      return "Consult standard security documentation for this threat type.";
    }
  }
}

export const geminiService = new GeminiService();
