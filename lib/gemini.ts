import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing in process.env.API_KEY");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const chatWithGemini = async (
  history: { role: 'user' | 'model'; content: string }[], 
  newMessage: string,
  systemContext: string = ""
) => {
  const ai = getAiClient();
  if (!ai) return "Error: API Key no configurada.";

  try {
    const modelId = 'gemini-3-pro-preview'; 
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: `Eres un asistente experto en contabilidad y leyes tributarias de Venezuela, específicamente sobre retenciones de IVA (SENIAT). 
        Ayuda al usuario a entender cómo llenar el comprobante, qué porcentajes aplicar (75% o 100%) y valida sus dudas.
        
        CONTEXTO ACTUAL DEL SISTEMA Y USUARIO:
        ${systemContext}
        
        Usa este contexto para dar respuestas personalizadas. Si te preguntan por una empresa o retención específica, busca en el contexto provisto.
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
        // Using gemini-3-pro-preview for high accuracy image reasoning as requested
        const result = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        text: `Analiza esta imagen de una factura venezolana (SENIAT).
                        Tu tarea es extraer los datos con extrema precisión para llenar un formulario de retención de IVA.
                        
                        Extrae la siguiente información en formato JSON estricto:
                        { 
                          "invoiceNumber": "Número de Factura (busca N° Factura, Factura)", 
                          "controlNumber": "Número de Control (busca N° Control, Control)", 
                          "supplierName": "Nombre o Razón Social del proveedor/emisor",
                          "supplierRif": "RIF del proveedor (Formato J-12345678-9)",
                          "date": "YYYY-MM-DD (convierte la fecha encontrada a este formato)",
                          "totalAmount": number (monto total de la factura incluyendo IVA),
                          "taxBase": number (base imponible o subtotal sobre el que aplica el IVA),
                          "taxAmount": number (monto del IVA),
                          "taxRate": number (porcentaje alícuota, usualmente 16)
                        }
                        
                        Reglas:
                        1. Si no encuentras un valor específico, usa null o 0.
                        2. Prioriza la exactitud de los montos numéricos.
                        3. Elimina cualquier símbolo de moneda (Bs, USD) de los números.
                        4. Verifica que taxBase + taxAmount sea aproximadamente igual a totalAmount (pueden haber exentos).`
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