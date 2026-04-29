import { ContractDetail } from "../../models/ContractModel";

/**
 * Exporta una lista de contratos a un archivo CSV y activa la descarga en el navegador.
 * @param contracts Array de contratos tipo ContractDetail
 * @param fileName Nombre del archivo (opcional)
 */
export const exportContractsToCSV = (
  contracts: ContractDetail[],
  fileName: string = 'CuidaDos_Contratos',
): void => {
  if (!contracts || contracts.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  const headers = [
    'ID Contrato',
    'Cliente',
    'Empresa',
    'Servicio',
    'Fecha Inicio',
    'Dia Semana',
    'Horario',
    'Precio (€)',
  ];

  const rows = contracts.map((c) => [
    c.id_contract,
    `"${c.Client?.clientName || 'N/A'}"`,
    `"${c.Business?.businessName || 'N/A'}"`,
    `"${c.serviceName || 'N/A'}"`,
    c.start_date,
    c.week_day_hired || 'N/A',
    c.time_hired || 'N/A',
    c.price || '0',
  ]);

  // El marcador '\ufeff' es para que Excel detecte la codificación UTF-8 correctamente
  const csvContent = '\ufeff' + [headers, ...rows].map((e) => e.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toLocaleDateString()}.csv`);

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
