
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
    // Correct Model selection based on task: Complex Text Tasks -> 'gemini-1.5-pro'
    const modelId = 'gemini-1.5-pro';
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
      // Correct Model selection based on task: Basic Text Tasks -> 'gemini-1.5-flash'
      model: 'gemini-1.5-flash',
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
  if (!ai) return '{"isInvoice": false, "error": "config_missing"}';

  try {
    // Using gemini-1.5-flash for speed and multi-modal stability
    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `Analiza esta imagen de una factura o ticket fiscal venezolano (SENIAT).
                        Tu tarea es extraer los datos con extrema precisión para un formulario de retención de IVA.
                        
                        Extrae la siguiente información en formato JSON estricto:
                        { 
                          "isInvoice": boolean (true si la imagen es una factura o ticket fiscal, false de lo contrario),
                          "invoiceNumber": "Número de Factura", 
                          "controlNumber": "Número de Control",
                          "supplierName": "Nombre del proveedor",
                          "supplierRif": "RIF del proveedor",
                          "date": "YYYY-MM-DD",
                          "totalAmount": number,
                          "taxBase": number,
                          "taxAmount": number,
                          "taxRate": number
                        }
                        
                        Reglas adicionales:
                        1. Si "isInvoice" es false, deja los demás campos como null o vacíos.
                        2. Si no encuentras un valor específico, usa null o string vacío.
                        3. Prioriza la exactitud de los montos numéricos.
                        4. REGLA DE ORO DEL NÚMERO DE CONTROL: Es vital para el SENIAT. Búscalo como 'N° de Control', 'Control No.', o en tickets de máquinas fiscales el código alfanumérico que empieza con 'Z'. Si ves múltiples números, el que tiene prefijo de letras suele ser el de control. No lo confundas con el número de factura.`
          }
        ]
      },
      config: { responseMimeType: 'application/json' }
    });
    return result.text || '{"isInvoice": false}';
  } catch (e) {
    console.error("Error analyzing image:", e);
    return '{"isInvoice": false, "error": true}';
  }
}
