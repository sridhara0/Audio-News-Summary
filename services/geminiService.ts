
import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function summarizeArticle(articleText: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following news article for a commuter's audio briefing. Be concise, engaging, and capture the key points. The summary will be converted to audio. Article:\n\n---\n\n${articleText}`,
        });
        return response.text;
    } catch (error) {
        console.error("Error in summarizeArticle:", error);
        throw new Error("Failed to get summary from Gemini API.");
    }
}

export async function textToSpeech(text: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            throw new Error("No audio data received from the API.");
        }
        
        return base64Audio;
    } catch (error) {
        console.error("Error in textToSpeech:", error);
        throw new Error("Failed to generate speech from Gemini API.");
    }
}
