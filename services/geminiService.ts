import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { StampData, Rarity } from "../types";

// Initialize the Google GenAI client
// We assume API_KEY is available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to clean up JSON strings returned by the AI
 * (Removes markdown code blocks if present)
 */
function cleanJsonString(text: string): string {
  // Remove ```json and ``` markers
  let clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
  return clean.trim();
}

// Safety settings using Enums to satisfy TypeScript requirements
// We allow all content to ensure historical stamps (war themes, etc.) are not blocked
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Step 1: Analyze the image visually.
 * We use gemini-3-pro-preview for high-fidelity image understanding.
 */
async function analyzeImageVisuals(base64Image: string, mimeType: string): Promise<string> {
  try {
    console.log("Starting Visual Analysis...");
    
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
            1. Country of origin (look for text on the stamp).
            2. Denomination/Value.
            3. Central subject (person, event, symbol).
            4. Color(s).
            5. Perforation condition.
            6. Cancellation marks (used vs mint).
            7. Any overprints.
            
            Return a single detailed paragraph description.`
          },
        ],
      },
      config: {
        safetySettings: safetySettings,
      }
    });

    if (!response.text) {
      throw new Error("Visual analysis returned empty response. The image might be unclear or blocked.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Visual analysis error:", error);
    throw new Error(`Visual Analysis Failed: ${error.message || error}`);
  }
}

/**
 * Step 2: Identify and Value the stamp using Search Grounding.
 */
async function identifyAndValueStamp(visualDescription: string): Promise<StampData> {
  try {
    console.log("Starting Identification...");

    const prompt = `
    I have a stamp with this visual description:
    "${visualDescription}"

    Act as the "GlobalStamp Collector AI". Identify this stamp, value it, and provide historical context.
    
    **CRITICAL INSTRUCTIONS:**
    1. You MUST search Google for this stamp using catalogs like Scott, Michel, or Colnect.
    2. Output MUST be valid JSON.
    3. Language: Turkish (Türkçe).

    **JSON Structure:**
    {
      "title": "Stamp Name",
      "country": "Country Name (Turkish)",
      "year": "Year",
      "rarity": "Nadir" | "Az Bulunur" | "Yaygın",
      "valueUsd": "$Price Range",
      "description": "Historical description (max 4 sentences)",
      "catalogRef": "Scott #123 or similar",
      "conditionNote": "Condition impact note",
      "rarityReason": "Reason if special (e.g. 'Hatalı Basım'), else null"
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        safetySettings: safetySettings,
      },
    });

    if (!response.text) {
      throw new Error("Identification returned empty response.");
    }

    const jsonString = cleanJsonString(response.text);
    let parsed: any = {};
    
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", response.text);
      // Attempt to find JSON object if mixed with text
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          throw new Error("Failed to parse AI response as JSON.");
        }
      } else {
        throw new Error("AI response did not contain valid JSON.");
      }
    }

    // Extract grounding URLs (Source links)
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
      groundingUrls: Array.from(new Set(groundingUrls)),
    };

  } catch (error: any) {
    console.error("Identification error:", error);
    throw new Error(`Identification Failed: ${error.message || error}`);
  }
}

export async function processStampImage(file: File): Promise<StampData> {
  // 1. Convert Image to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (err) => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

  // 2. Analyze Visuals
  const description = await analyzeImageVisuals(base64Data, file.type);
  
  // 3. Identify & Value
  const result = await identifyAndValueStamp(description);

  return result;
}
