
import React, { useRef } from 'react';
import { RetentionVoucher as VoucherType } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  data: VoucherType;
}

const RetentionVoucher: React.FC<Props> = ({ data }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const items = data.items || [];
  const totalBase = items.reduce((acc, item) => acc + item.taxBase, 0);
  const totalTax = items.reduce((acc, item) => acc + item.taxAmount, 0);
  const totalRetained = items.reduce((acc, item) => acc + item.retentionAmount, 0);
  const totalPurchase = items.reduce((acc, item) => acc + item.totalAmount, 0);

  const fiscalPeriodSafe = data.fiscalPeriod || '';
  const [fiscalYear, fiscalMonth] = fiscalPeriodSafe.split(' ');

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 3,
        useCORS: true, 
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Comprobante_${data.voucherNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Error generando el PDF.");
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-[210mm] flex justify-end gap-3 mb-2 no-print">
         {data.invoiceUrl && (
             <a 
               href={data.invoiceUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               className="bg-emerald-600 text-white px-3 py-1.5 rounded shadow hover:bg-emerald-700 flex items-center gap-2 text-sm"
             >
               <span className="material-icons text-sm">visibility</span> Ver Respaldo
             </a>
         )}
         <button 
           onClick={handleDownloadPdf}
           className="bg-blue-600 text-white px-3 py-1.5 rounded shadow hover:bg-blue-700 flex items-center gap-2 text-sm"
         >
           <span className="material-icons text-sm">picture_as_pdf</span> Descargar PDF
         </button>
      </div>

      <div 
        ref={contentRef}
        id="voucher-content"
        className="bg-white p-5 w-full max-w-[210mm] text-[9px] leading-tight font-sans text-black border border-gray-200 shadow-lg print:shadow-none print:border-none print:w-full print:max-w-none box-border mx-auto"
      >
        <div className="mb-3 text-[9px] font-semibold text-justify flex justify-between items-start gap-4">
          <div className="flex-1 leading-snug">
             LEY I.V.A. ART. 11 "SERAN RESPONSABLES DEL PAGO DE IMPUESTO EN CALIDAD DE AGENTES DE RETENCION LOS COMPRADORES O ADQUIRIENTES DE DETERMINADOS BIENES MUEBLES Y LOS RECEPTORES DE CIERTOS SERVICIOS A QUIENES LA ADMINISTRACION TRIBUTARIA DESIGNE COMO TAL.
          </div>
          {data.company.logoUrl && (
              <img src={data.company.logoUrl} alt="Logo" className="h-10 w-auto object-contain max-w-[120px]" />
          )}
        </div>

        <div className="flex justify-end gap-2 mb-3">
          <div className="border border-black px-1 py-0.5 w-40">
            <div className="font-bold border-b border-black mb-0.5">0.- NRO. DE COMPROBANTE:</div>
            <div className="text-center text-sm font-bold">{data.voucherNumber}</div>
          </div>
          <div className="border border-black px-1 py-0.5 w-20">
            <div className="font-bold border-b border-black mb-0.5">1.- FECHA:</div>
            <div className="text-center">{data.date}</div>
          </div>
        </div>

        <div className="flex gap-2 mb-1">
          <div className="border border-black px-1 py-0.5 flex-grow">
            <div className="font-bold border-b border-gray-300 mb-0.5">2.- NOMBRE O RAZON SOCIAL DEL AGENTE DE RETENCION:</div>
            <div className="uppercase font-bold text-center py-0.5 text-xs">{data.company.name}</div>
          </div>
          <div className="border border-black px-1 py-0.5 w-1/3">
            <div className="font-bold border-b border-gray-300 mb-0.5">3.- REGISTRO DE INFORMACION FISCAL DEL AGENTE DE RETENCION:</div>
            <div className="uppercase font-bold text-center py-0.5 text-xs">{data.company.rif}</div>
          </div>
           <div className="border border-black px-1 py-0.5 w-28">
            <div className="font-bold border-b border-gray-300 mb-0.5">4.- PERIODO FISCAL:</div>
            <div className="text-center">
               <span className="mr-2">{fiscalYear}</span>
               <span>{fiscalMonth}</span>
            </div>
          </div>
        </div>

        <div className="border border-black px-1 py-0.5 mb-3">
          <div className="font-bold border-b border-gray-300 mb-0.5">5.- DIRECCION DEL AGENTE DE RETENCION:</div>
          <div className="uppercase py-0.5 text-[8px]">{data.company.address}</div>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="border border-black px-1 py-0.5 flex-grow">
            <div className="font-bold border-b border-gray-300 mb-0.5">6.- NOMBRE O RAZON SOCIAL DEL SUJETO RETENIDO:</div>
            <div className="uppercase font-bold text-center py-0.5 text-xs">{data.supplier.name}</div>
          </div>
          <div className="border border-black px-1 py-0.5 w-1/3">
            <div className="font-bold border-b border-gray-300 mb-0.5">7.- REGISTRO DE INFORMACION FISCAL DEL SUJETO RETENIDO</div>
            <div className="uppercase font-bold text-center py-0.5 text-xs">{data.supplier.rif}</div>
          </div>
        </div>

        <div className="mb-4 hidden md:block print:block">
          <table className="w-full border-collapse border border-black text-center text-[8px]">
            <thead>
              <tr className="bg-gray-100">
                 <th className="border border-black p-0.5" rowSpan={2}>OPER. NRO.</th>
                 <th className="border border-black p-0.5" rowSpan={2}>FECHA DE LA FACTURA</th>
                 <th className="border border-black p-0.5" rowSpan={2}>NUMERO DE FACTURA</th>
                 <th className="border border-black p-0.5" rowSpan={2}>NUM. CTROL DE FACTURA</th>
                 <th className="border border-black p-0.5" rowSpan={2}>NUMERO NOTA DEBITO</th>
                 <th className="border border-black p-0.5" rowSpan={2}>NUMERO NOTA CREDITO</th>
                 <th className="border border-black p-0.5" rowSpan={2}>TIPO DE TRANSACC.</th>
                 <th className="border border-black p-0.5" rowSpan={2}>NUMERO DE FACTURA AFECTADA</th>
                 <th className="border border-black p-0.5" rowSpan={2}>TOTAL COMPRAS INCLUYENDO I.V.A.</th>
                 <th className="border border-black p-0.5" rowSpan={2}>COMPRAS SIN DERECHO A CREDITO I.V.A.</th>
                 <th className="border border-black p-0.5" colSpan={3}>COMPRAS INTERNAS E IMPORTACIONES</th>
                 <th className="border border-black p-0.5" rowSpan={2}>I.V.A. RETENIDO</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black p-0.5">BASE IMPONIBLE</th>
                <th className="border border-black p-0.5">% ALICUOT</th>
                <th className="border border-black p-0.5">IMPUESTO I.V.A.</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-black p-0.5">{index + 1}</td>
                  <td className="border border-black p-0.5">{item.date}</td>
                  <td className="border border-black p-0.5">{item.invoiceNumber}</td>
                  <td className="border border-black p-0.5">{item.controlNumber}</td>
                  <td className="border border-black p-0.5">{item.noteNumber || ''}</td>
                  <td className="border border-black p-0.5"></td>
                  <td className="border border-black p-0.5">{item.transactionType}</td>
                  <td className="border border-black p-0.5">{item.affectedInvoice || ''}</td>
                  <td className="border border-black p-0.5 text-right">{item.totalAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                  <td className="border border-black p-0.5 text-right">{item.exemptAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                  <td className="border border-black p-0.5 text-right">{item.taxBase.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                  <td className="border border-black p-0.5">{item.taxRate}%</td>
                  <td className="border border-black p-0.5 text-right">{item.taxAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                  <td className="border border-black p-0.5 text-right font-bold">{item.retentionAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
               <tr className="font-bold">
                 <td className="border-none p-0.5 text-right" colSpan={8}>TOTALES</td>
                 <td className="border border-black p-0.5 text-right">{totalPurchase.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                 <td className="border border-black p-0.5 text-right">0,00</td>
                 <td className="border border-black p-0.5 text-right">{totalBase.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                 <td className="border border-black p-0.5 bg-gray-100"></td>
                 <td className="border border-black p-0.5 text-right">{totalTax.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                 <td className="border border-black p-0.5 text-right">{totalRetained.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
               </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end mb-8">
           <div className="w-full md:w-1/3 flex justify-between items-center border-2 border-black p-2 bg-gray-100 shadow-sm">
              <span className="font-bold text-xs uppercase">Total a Retener</span>
              <span className="font-extrabold text-lg text-black">{totalRetained.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span>
           </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end mt-8 px-6 gap-8 md:gap-0">
          <div className="text-center w-full md:w-64">
             <div className="border-b border-black mb-1 h-12 flex items-end justify-center relative">
                <div className="absolute top-0 left-0 text-gray-300 text-3xl font-script transform -rotate-12 opacity-50 whitespace-nowrap overflow-hidden max-w-full">
                   {data.company.name.substring(0, 20)}
                </div>
             </div>
             <div className="text-[8px] font-bold">FIRMA Y SELLO DEL AGENTE DE RETENCION</div>
          </div>
          <div className="text-center w-full md:w-64">
             <div className="border-b border-black mb-1 h-12"></div>
             <div className="text-[8px] font-bold">FIRMA DEL BENEFICIARIO</div>
             <div className="text-[8px] mt-0.5 text-gray-500">FECHA DE RECEPCIÓN: _____/_____/_________</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetentionVoucher;
