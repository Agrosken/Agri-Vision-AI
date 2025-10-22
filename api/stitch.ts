import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality, Part } from "@google/genai";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'API key not configured on the server.' });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const { images, baseImage } = request.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return response.status(400).json({ error: 'No new images were provided.' });
    }
    
    const parts: Part[] = [...images];
    let promptText: string;

    if (baseImage) {
        parts.unshift(baseImage);
        promptText = `Take the first image, which is an existing orthomosaic map, and stitch the subsequent new drone images onto it. The new images may overlap with the map and each other. Align them correctly to expand the map. Output only the final, expanded single image.`;
    } else {
        promptText = `Stitch these top-down drone images into a single, seamless orthomosaic map. The images have overlap. Align them correctly to create a coherent single image of the entire area. Output only the final stitched image.`;
    }

    parts.push({ text: promptText });


    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    const imagePart = geminiResponse.candidates?.[0]?.content?.parts?.find(p => !!p.inlineData);

    if (imagePart?.inlineData?.data && imagePart?.inlineData?.mimeType) {
      const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      return response.status(200).json({ imageUrl });
    }

    console.error("Invalid response structure from Gemini API:", JSON.stringify(geminiResponse, null, 2));
    throw new Error("The AI model did not return a valid stitched image.");

  } catch (error: any) {
    console.error('Error in stitch function:', error);
    
    // Extract a more specific error message if available from the API response body
    const errorBody = error?.response?.data || error;
    const errorMessage = errorBody?.error?.message || (error instanceof Error ? error.message : 'An unknown server error occurred.');
    
    // Specifically handle the 429 Quota Exceeded error from Google AI.
    if (String(errorMessage).includes('429') || String(errorMessage).includes('RESOURCE_EXHAUSTED') || String(errorMessage).includes('quota')) {
        return response.status(429).json({ 
            error: 'You have exceeded your request quota for the AI service. This is a temporary limit on the free plan. Please wait a few minutes and try again, or check your Google AI billing details for higher limits.' 
        });
    }

    return response.status(500).json({ error: `Failed to stitch images: ${errorMessage}` });
  }
}
