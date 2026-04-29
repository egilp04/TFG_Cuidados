import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ContractDetail } from '../models/ContractModel';

@Injectable({
  providedIn: 'root',
})
export class DocsPdf {
  private generateDocument(contract: ContractDetail): jsPDF {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [30, 75, 64];

    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('CuidaDos', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`System ID: ${contract.id_contract}`, 14, 28);

    autoTable(doc, {
      startY: 40,
      head: [['Concepto', 'Descripción']],
      body: [
        ['ID del contrato', contract.id_contract || 'N/A'],
        ['Nombre del cliente', contract.Client?.clientName || 'N/A'],
        ['Nombre de la empresa', contract.Business?.businessName || 'N/A'],
        ['Servicio contratado', contract.serviceName || 'N/A'],
        ['Fecha de inicio', contract.start_date],
        ['Dia de la semana', contract.week_day_hired || 'N/A'],
        ['Hora', contract.time_hired || 'N/A'],
        ['Precio (€)', contract.price || 'N/A'],
      ],
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text('documento generado por: CuidaDos.', 14, pageHeight - 10);

    return doc;
  }

  public downloadPDF(contract: ContractDetail): void {
    const doc = this.generateDocument(contract);
    doc.save(`Contract_${contract.id_contract.substring(0, 8)}.pdf`);
  }

  public getBase64PDF(contract: ContractDetail): string {
    const doc = this.generateDocument(contract);
    return doc.output('datauristring');
  }
}
