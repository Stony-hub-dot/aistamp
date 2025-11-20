import { GoogleGenAI } from "@google/genai";
import { StampData, Rarity } from "../types";

// The API key is injected by Vite's define plugin at build time.
// We assume it is valid as per the application setup.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helpers to extract JSON from markdown code blocks if necessary
 */
function cleanJsonString(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) {
    return match[1];
  }
  return text;
}

/**
 * Step 1: Analyze the image visually using gemini-3-pro-preview
 * This gets the fine details: perforation, cancellation, design details.
 */
async function analyzeImageVisuals(base64Image: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: `Act as a professional expert philatelist. Examine this stamp image in extreme detail. 
            Describe the following visual elements precisely:
            1. Country of origin (look for text).
            2. Denomination/Value.
            3. Central subject (person, event, symbol).
            4. Color(s).
            5. Perforation condition (imperforate vs perforated).
            6. Cancellation marks (used vs mint appearance).
            7. Any overprints or surcharges.
            
            Provide a detailed descriptive paragraph.`
          },
        ],
      },
    });
    return response.text || "No description generated.";
  } catch (error) {
    console.error("Visual analysis failed:", error);
    throw new Error("Could not analyze the image visuals.");
  }
}

/**
 * Step 2: Use the description + Google Search to find market data and history.
 * Uses gemini-2.5-flash with Search Grounding.
 */
async function identifyAndValueStamp(visualDescription: string): Promise<StampData> {
  try {
    const prompt = `
    I have a stamp with the following visual description:
    "${visualDescription}"

    Your task is to identify this stamp, value it, and provide historical context acting as a "GlobalStamp Collector AI".
    
    **Sources:** YOU MUST cross-reference data from reputable authorities like Scott, Michel, Stanley Gibbons, Yvert et Tellier, and Colnect via Google Search. Do not rely on Etsy/eBay listings for identification, only for rough market sentiment if catalogs are unavailable.

    **Output Language:** Turkish (Türkçe).

    **Required Fields in JSON Format:**
    1. "title": Name of the stamp.
    2. "country": Country name (in Turkish).
    3. "year": Year of issue.
    4. "rarity": Must be one of ["Nadir", "Az Bulunur", "Yaygın"].
    5. "valueUsd": Estimated price range in USD (e.g., "$10 - $50"). Add a note if condition heavily affects this.
    6. "description": A strictly limited description of maximum 4 sentences explaining the stamp's origin, the figure/event depicted, and why it is significant.
    7. "catalogRef": Likely catalog number (e.g., Scott #123).
    8. "conditionNote": A brief note on how condition (mint/used) affects this specific stamp's value based on the visual description provided.
    9. "rarityReason": Identify if there is a SPECIAL reason for rarity. Examples: "Geri çekildi" (Withdrawn), "Tedavüle çıkmadı" (Never issued), "Hatalı Basım" (Error), "Sürşarj Hatası" (Overprint error). If it is a standard stamp, return null.

    Output ONLY raw JSON.
    `;

    // Note: Grounding tools prevent usage of responseSchema. We must parse the text manually.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text || "{}";
    const jsonString = cleanJsonString(rawText);
    let parsed: any = {};
    
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON from search result", rawText);
      throw new Error("AI response was not in valid JSON format.");
    }

    // Extract grounding URLs
    const groundingUrls: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        groundingUrls.push(chunk.web.uri);
      }
    });

    return {
      title: parsed.title || "Bilinmeyen Pul",
      country: parsed.country || "Bilinmiyor",
      year: parsed.year || "????",
      rarity: (parsed.rarity as Rarity) || Rarity.COMMON,
      valueUsd: parsed.valueUsd || "N/A",
      description: parsed.description || "Açıklama bulunamadı.",
      catalogRef: parsed.catalogRef || "Katalog bilgisi yok",
      conditionNote: parsed.conditionNote,
      rarityReason: parsed.rarityReason,
      groundingUrls: Array.from(new Set(groundingUrls)), // deduplicate
    };

  } catch (error) {
    console.error("Identification failed:", error);
    throw new Error("Could not identify stamp data from catalogs.");
  }
}

export async function processStampImage(file: File): Promise<StampData> {
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Step 1: Vision Analysis
  const description = await analyzeImageVisuals(base64Data, file.type);
  
  // Step 2: Search & Valuation
  const result = await identifyAndValueStamp(description);

  return result;
}