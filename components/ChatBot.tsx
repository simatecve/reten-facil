
import React, { useState, useRef, useEffect } from 'react';
import { chatWithGemini } from '../lib/gemini';
import { Company, RetentionVoucher, UserProfile } from '../types';

interface ChatBotProps {
  userProfile: UserProfile | null;
  companies: Company[];
  recentVouchers: RetentionVoucher[];
}

const ChatBot: React.FC<ChatBotProps> = ({ userProfile, companies, recentVouchers }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: 'Hola, soy tu asistente de RetenFácil. ¿En qué puedo ayudarte con tus retenciones o impuestos hoy?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Construct context string from props with safety checks
  const getSystemContext = () => {
    if (!userProfile) return "Usuario no identificado.";

    const companyList = companies?.map(c => `- ${c?.name || 'Empresa'} (${c?.rif || 'S/R'})`).join('\n');
    const voucherList = recentVouchers?.slice(0, 5).map(v => 
      `- Comprobante: ${v?.voucherNumber}, Fecha: ${v?.date}, Prov: ${v?.supplier?.name || 'N/A'}, Monto Retenido: ${(v?.items || []).reduce((acc, i) => acc + (i?.retentionAmount || 0), 0).toFixed(2)}`
    ).join('\n');

    return `
      Usuario: ${userProfile.first_name} ${userProfile.last_name || ''}
      
      Empresas Registradas (Agentes):
      ${companyList || 'Ninguna registrada'}

      Últimas 5 Retenciones Generadas:
      ${voucherList || 'Ninguna generada'}
    `;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue;
    setInputValue('');
    const newHistory = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    const context = getSystemContext();
    const response = await chatWithGemini(newHistory, userMsg, context);
    
    setMessages(prev => [...prev, { role: 'model', content: response || "Error al obtener respuesta de la IA." }]);
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center gap-2"
      >
        <span className="material-icons">voice_chat</span>
        <span className="font-bold hidden md:inline">Asistente IA</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200 overflow-hidden font-sans animate-fade-in-up">
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
            <span className="material-icons text-sm">auto_awesome</span>
            RetenFácil AI
        </h3>
        <button onClick={() => setIsOpen(false)} className="hover:text-gray-200">
            <span className="material-icons">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm text-gray-500 text-xs flex items-center gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Pregunta sobre tus empresas o retenciones..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          <span className="material-icons text-sm">send</span>
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
