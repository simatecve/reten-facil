import React from 'react';
import { RetentionVoucher as VoucherType } from '../types';

interface Props {
  data: VoucherType;
}

const RetentionVoucher: React.FC<Props> = ({ data }) => {
  const totalBase = data.items.reduce((acc, item) => acc + item.taxBase, 0);
  const totalTax = data.items.reduce((acc, item) => acc + item.taxAmount, 0);
  const totalRetained = data.items.reduce((acc, item) => acc + item.retentionAmount, 0);
  const totalPurchase = data.items.reduce((acc, item) => acc + item.totalAmount, 0);

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto text-[10px] leading-tight font-sans text-black border border-gray-200 shadow-lg print:shadow-none print:border-none print:w-full print:max-w-none">
      
      {/* Header Law Reference */}
      <div className="mb-4 text-xs font-semibold text-justify flex justify-between items-start gap-4">
        <div className="flex-1">
           LEY I.V.A. ART. 11 "SERAN RESPONSABLES DEL PAGO DE IMPUESTO EN CALIDAD DE AGENTES DE RETENCION LOS COMPRADORES O ADQUIRIENTES DE DETERMINADOS BIENES MUEBLES Y LOS RECEPTORES DE CIERTOS SERVICIOS A QUIENES LA ADMINISTRACION TRIBUTARIA DESIGNE COMO TAL.
        </div>
        {data.company.logoUrl && (
            <img src={data.company.logoUrl} alt="Logo" className="h-12 w-auto object-contain max-w-[150px]" />
        )}
      </div>

      {/* Top Meta Data */}
      <div className="flex justify-end gap-2 mb-4">
        <div className="border border-black p-1 w-48">
          <div className="font-bold border-b border-black mb-1">0.- NRO. DE COMPROBANTE:</div>
          <div className="text-center text-sm font-bold">{data.voucherNumber}</div>
        </div>
        <div className="border border-black p-1 w-24">
          <div className="font-bold border-b border-black mb-1">1.- FECHA:</div>
          <div className="text-center">{data.date}</div>
        </div>
      </div>

      {/* Agent Info */}
      <div className="flex gap-4 mb-2">
        <div className="border border-black p-1 flex-grow">
          <div className="font-bold border-b border-gray-300 mb-1">2.- NOMBRE O RAZON SOCIAL DEL AGENTE DE RETENCION:</div>
          <div className="uppercase font-bold text-center py-1 text-sm">{data.company.name}</div>
        </div>
        <div className="border border-black p-1 w-1/3">
          <div className="font-bold border-b border-gray-300 mb-1">3.- REGISTRO DE INFORMACION FISCAL DEL AGENTE DE RETENCION:</div>
          <div className="uppercase font-bold text-center py-1 text-sm">{data.company.rif}</div>
        </div>
         <div className="border border-black p-1 w-32">
          <div className="font-bold border-b border-gray-300 mb-1">4.- PERIODO FISCAL:</div>
          <div className="text-center">
             <span className="mr-2">{data.fiscalPeriod.split(' ')[0]}</span>
             <span>{data.fiscalPeriod.split(' ')[1]}</span>
          </div>
        </div>
      </div>

      {/* Agent Address */}
      <div className="border border-black p-1 mb-6">
        <div className="font-bold border-b border-gray-300 mb-1">5.- DIRECCION DEL AGENTE DE RETENCION:</div>
        <div className="uppercase py-1">{data.company.address}</div>
      </div>

      {/* Supplier Info */}
      <div className="flex gap-4 mb-6">
        <div className="border border-black p-1 flex-grow">
          <div className="font-bold border-b border-gray-300 mb-1">6.- NOMBRE O RAZON SOCIAL DEL SUJETO RETENIDO:</div>
          <div className="uppercase font-bold text-center py-1 text-sm">{data.supplier.name}</div>
        </div>
        <div className="border border-black p-1 w-1/3">
          <div className="font-bold border-b border-gray-300 mb-1">7.- REGISTRO DE INFORMACION FISCAL DEL SUJETO RETENIDO</div>
          <div className="uppercase font-bold text-center py-1 text-sm">{data.supplier.rif}</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-black text-center">
          <thead>
            <tr className="bg-gray-100">
               <th className="border border-black p-1" rowSpan={2}>OPER. NRO.</th>
               <th className="border border-black p-1" rowSpan={2}>FECHA DE LA FACTURA</th>
               <th className="border border-black p-1" rowSpan={2}>NUMERO DE FACTURA</th>
               <th className="border border-black p-1" rowSpan={2}>NUM. CTROL DE FACTURA</th>
               <th className="border border-black p-1" rowSpan={2}>NUMERO NOTA DEBITO</th>
               <th className="border border-black p-1" rowSpan={2}>NUMERO NOTA CREDITO</th>
               <th className="border border-black p-1" rowSpan={2}>TIPO DE TRANSACC.</th>
               <th className="border border-black p-1" rowSpan={2}>NUMERO DE FACTURA AFECTADA</th>
               <th className="border border-black p-1" rowSpan={2}>TOTAL COMPRAS INCLUYENDO I.V.A.</th>
               <th className="border border-black p-1" rowSpan={2}>COMPRAS SIN DERECHO A CREDITO I.V.A.</th>
               <th className="border border-black p-1" colSpan={3}>COMPRAS INTERNAS E IMPORTACIONES</th>
               <th className="border border-black p-1" rowSpan={2}>I.V.A. RETENIDO</th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-black p-1">BASE IMPONIBLE</th>
              <th className="border border-black p-1">% ALICUOT</th>
              <th className="border border-black p-1">IMPUESTO I.V.A.</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black p-1">{index + 1}</td>
                <td className="border border-black p-1">{item.date}</td>
                <td className="border border-black p-1">{item.invoiceNumber}</td>
                <td className="border border-black p-1">{item.controlNumber}</td>
                <td className="border border-black p-1">{item.noteNumber || ''}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1">{item.transactionType}</td>
                <td className="border border-black p-1">{item.affectedInvoice || ''}</td>
                <td className="border border-black p-1 text-right">{item.totalAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                <td className="border border-black p-1 text-right">{item.exemptAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                <td className="border border-black p-1 text-right">{item.taxBase.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                <td className="border border-black p-1">{item.taxRate}%</td>
                <td className="border border-black p-1 text-right">{item.taxAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                <td className="border border-black p-1 text-right font-bold">{item.retentionAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
             {/* Empty rows filler if needed, typically printed forms have static rows, but dynamic is better for SaaS */}
             {Array.from({ length: Math.max(0, 5 - data.items.length) }).map((_, i) => (
               <tr key={`empty-${i}`}>
                 <td className="border border-black p-1">&nbsp;</td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
                 <td className="border border-black p-1"></td>
               </tr>
             ))}
          </tbody>
          <tfoot>
             <tr className="font-bold">
               <td className="border-none p-1 text-right" colSpan={8}>TOTALES</td>
               <td className="border border-black p-1 text-right">{totalPurchase.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
               <td className="border border-black p-1 text-right">0,00</td>
               <td className="border border-black p-1 text-right">{totalBase.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
               <td className="border border-black p-1 bg-gray-100"></td>
               <td className="border border-black p-1 text-right">{totalTax.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
               <td className="border border-black p-1 text-right">{totalRetained.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
             </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end mb-8">
         <div className="w-1/3 flex justify-between font-bold text-sm">
            <span>TOTAL Bs.</span>
            <span>{totalRetained.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span>
         </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between items-end mt-16 px-8">
        <div className="text-center w-64">
           <div className="border-b border-black mb-2 h-16 flex items-end justify-center relative">
              <div className="absolute top-0 left-0 text-gray-300 text-3xl font-script transform -rotate-12 opacity-50">
                 {data.company.name}
              </div>
           </div>
           <div>FIRMA Y SELLO DEL AGENTE DE RETENCION</div>
        </div>
        <div className="text-center w-64">
           <div className="border-b border-black mb-2 h-16"></div>
           <div>FIRMA DEL BENEFICIARIO</div>
           <div className="text-[9px] mt-1 text-gray-500">FECHA DE RECEPCIÓN: _____/_____/_________</div>
        </div>
      </div>
    </div>
  );
};

export default RetentionVoucher;