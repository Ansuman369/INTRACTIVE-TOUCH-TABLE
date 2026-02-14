import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MOCK_DATA: Record<string, GeneratedContent> = {
  default: {
    summary: "A cutting-edge futuristic workspace design.",
    innovationPoint: "Integration of IoT and reactive lighting.",
    locationContext: "Located in the tech hub of Bangalore."
  }
};

export const fetchProjectDetails = async (projectName: string, context: string): Promise<GeneratedContent> => {
  if (!ai) {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_DATA.default), 800));
  }

  try {
    const prompt = `Provide JSON details for the architectural project "${projectName}" (${context}). 
    Constraints:
    - summary: Max 15 words. High-tech description.
    - innovationPoint: Max 10 words. Key design feature.
    - locationContext: Max 10 words. Geographic significance.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            innovationPoint: { type: Type.STRING },
            locationContext: { type: Type.STRING },
          },
        },
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response from Gemini");
    
    return JSON.parse(text) as GeneratedContent;

  } catch (error) {
    console.error("Error fetching Gemini data:", error);
    return MOCK_DATA.default;
  }
};
