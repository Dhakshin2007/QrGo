import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

// Initialize the Google GenAI client if the API key is available in environment variables.
// For this application, the API key is expected to be set in the `process.env.API_KEY`
// environment variable.
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    // If the API key is not found, log a warning to the console.
    // AI-powered features will be disabled.
    console.warn("Google AI API key is not configured in process.env.API_KEY. AI features will be disabled.");
}


export type AISuggestion = 'Plausible' | 'Suspicious' | 'Invalid' | 'Error';

const getTxnIdSuggestion = async (transactionId: string): Promise<AISuggestion> => {
    // If AI is not configured, return an error state.
    if (!ai) {
        // This indicates the API key was not provided.
        return 'Error';
    }
    
    // Basic validation to avoid unnecessary API calls for clearly invalid IDs
    if (!transactionId || transactionId.trim().length < 5) {
        return 'Invalid';
    }
    
    const prompt = `Analyze the following transaction ID. Is it a plausible ID for a financial payment? A plausible ID is usually a long string of numbers or alphanumeric characters. An invalid ID would be a common word or very short text. Respond with a single word ONLY: "Plausible", "Suspicious", or "Invalid".
    
    ID: "${transactionId}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const text = response.text.trim();

        if (text === 'Plausible' || text === 'Suspicious' || text === 'Invalid') {
            return text;
        }
        
        // If the model returns something unexpected, we treat it as suspicious.
        console.warn(`Unexpected AI response for txnId ${transactionId}: ${text}`);
        return 'Suspicious';

    } catch (error) {
        console.error('Error fetching AI suggestion:', error);
        // This could be due to an invalid API key, network issues, or other API errors.
        return 'Error';
    }
};

export const aiService = {
    getTxnIdSuggestion
};