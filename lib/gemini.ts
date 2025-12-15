import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing in process.env.API_KEY");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const chatWithGemini = async (history: { role: 'user' | 'model'; content: string }[], newMessage: string) => {
  const ai = getAiClient();
  if (!ai) return "Error: API Key no configurada.";

  try {
    const modelId = 'gemini-3-pro-preview'; // Intelligent model for legal/tax questions
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: `Eres un asistente experto en contabilidad y leyes tributarias de Venezuela, específicamente sobre retenciones de IVA (SENIAT). 
        Ayuda al usuario a entender cómo llenar el comprobante, qué porcentajes aplicar (75% o 100%) y valida sus dudas. 
        Responde en español de forma concisa y profesional.`,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lo siento, hubo un error al procesar tu consulta con la IA.";
  }
};

export const analyzeInvoiceText = async (text: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Error config";

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analiza el siguiente texto que parece ser data de una factura venezolana. 
            Extrae formato JSON: { "invoiceNumber": string, "controlNumber": string, "base": number, "iva": number, "total": number, "rif": string, "date": "YYYY-MM-DD" }.
            Si falta algún dato ponlo como string vacío o 0.
            Texto: ${text}`,
            config: { responseMimeType: 'application/json' }
        });
        return result.text || "{}";
    } catch (e) {
        return "{}";
    }
}

export const analyzeInvoiceImage = async (base64Image: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Error config";

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Using flash for fast multimodal processing
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        text: `Analiza esta imagen de una factura venezolana.
                        Extrae la siguiente información en formato JSON estricto:
                        { 
                          "invoiceNumber": "Número de Factura", 
                          "controlNumber": "Número de Control", 
                          "supplierName": "Nombre del proveedor",
                          "supplierRif": "RIF del proveedor",
                          "date": "YYYY-MM-DD",
                          "totalAmount": number (monto total con IVA),
                          "taxBase": number (base imponible),
                          "taxAmount": number (monto IVA),
                          "taxRate": number (ejemplo: 16)
                        }
                        Si no encuentras un valor específico, usa null o 0. Prioriza la exactitud de los montos.`
                    }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });
        return result.text || "{}";
    } catch (e) {
        console.error("Error analyzing image:", e);
        return "{}";
    }
}
