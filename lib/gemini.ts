
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // En producción (Vite build), las variables se inyectan en tiempo de construcción.
  // Si no están presentes en el servidor de despliegue, pueden quedar vacías.
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null) ||
    (typeof process !== 'undefined' ? process.env.API_KEY : null) ||
    (window as any).VITE_GEMINI_API_KEY; // Posible inyección vía script en index.html

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.warn("⚠️ Advertencia: Gemini API Key no encontrada.");
    console.info("Asegúrate de configurar VITE_GEMINI_API_KEY en las variables de entorno de tu servidor (Vercel, Netlify, etc.) y reconstruir el proyecto.");
    return null;
  }

  return new GoogleGenAI({ apiKey });
};

export const chatWithGemini = async (
  history: { role: 'user' | 'model'; content: string }[],
  newMessage: string,
  systemContext: string = ""
) => {
  const ai = getAiClient();
  if (!ai) return "Error: API Key no configurada.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      config: {
        systemInstruction: `Eres un asistente experto en contabilidad y leyes tributarias de Venezuela, específicamente sobre retenciones de IVA (SENIAT). 
          Ayuda al usuario a entender cómo llenar el comprobante y valida sus dudas.
          CONTEXTO: ${systemContext}`
      },
      contents: [
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: newMessage }] }
      ]
    });

    return response.text || "No recibí respuesta.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "Error al procesar consulta.";
  }
};

export const analyzeInvoiceText = async (text: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "{}";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      config: { responseMimeType: 'application/json' },
      contents: [{
        role: 'user',
        parts: [{ text: `Analiza este texto y extrae JSON fiscal venezolano: ${text}` }]
      }]
    });
    return response.text || "{}";
  } catch (e) {
    return "{}";
  }
}

export const analyzeInvoiceImage = async (base64Image: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return '{"isInvoice": false, "error": "config_missing"}';

  try {
    // ACTUALIZADO A GEMINI 2.0 FLASH PARA MEJOR OCR
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: {
        responseMimeType: 'application/json'
      },
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image
            }
          },
          {
            text: `Eres un experto en fiscalidad venezolana. Extrae los datos de esta imagen.
            IMPORTANTE: Marcar "isInvoice": true si ves un RIF y montos. Ignora textos de "SIN DERECHO A CRÉDITO FISCAL".
            
            DATO CRÍTICO: El NÚMERO DE CONTROL está VERTICAL en el margen derecho (ej: 00-1371586).
            
            Extrae este JSON:
            {
              "isInvoice": true,
              "invoiceNumber": string,
              "controlNumber": string,
              "supplierName": string,
              "supplierRif": string,
              "date": "YYYY-MM-DD",
              "totalAmount": number,
              "taxBase": number,
              "taxAmount": number,
              "taxRate": 16
            }`
          }
        ]
      }]
    });

    console.log("Gemini 2.0 Response:", response.text);
    return response.text || '{"isInvoice": false}';
  } catch (e: any) {
    console.error("Error OCR:", e);
    return JSON.stringify({ isInvoice: false, error: e.message });
  }
}
