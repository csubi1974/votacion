import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ElectionResult {
    election: {
        id: number;
        title: string;
        description: string;
        status: string;
        startDate: string;
        endDate: string;
    };
    results: Array<{
        optionId: number;
        text: string;
        votes: number;
        percentage: number;
    }>;
    totalVotes: number;
}

/**
 * Export election results to PDF with professional formatting
 */
export const exportToPDF = (results: ElectionResult) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55); // gray-800
    doc.text('Resultados de Elección', 14, 20);

    // Election info
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99); // gray-600
    doc.text(results.election.title, 14, 30);
    doc.setFontSize(10);
    doc.text(results.election.description, 14, 37, { maxWidth: 180 });

    // Dates
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // gray-500
    const startDate = new Date(results.election.startDate).toLocaleDateString('es-CL');
    const endDate = new Date(results.election.endDate).toLocaleDateString('es-CL');
    doc.text(`Período: ${startDate} - ${endDate}`, 14, 50);

    // Total votes
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text(`Total de votos: ${results.totalVotes}`, 14, 58);

    // Results table
    const tableData = results.results.map(result => [
        result.text,
        result.votes.toString(),
        `${result.percentage.toFixed(2)}%`
    ]);

    autoTable(doc, {
        startY: 65,
        head: [['Opción', 'Votos', 'Porcentaje']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [59, 130, 246], // blue-600
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11,
        },
        bodyStyles: {
            fontSize: 10,
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251], // gray-50
        },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' },
        },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175); // gray-400
        doc.text(
            `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString('es-CL')}`,
            14,
            doc.internal.pageSize.height - 10
        );
    }

    // Save
    const filename = `resultados-${results.election.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    doc.save(filename);
};

/**
 * Export election results to Excel
 */
export const exportToExcel = (results: ElectionResult) => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Election info sheet
    const infoData = [
        ['Título', results.election.title],
        ['Descripción', results.election.description],
        ['Estado', results.election.status],
        ['Fecha Inicio', new Date(results.election.startDate).toLocaleDateString('es-CL')],
        ['Fecha Fin', new Date(results.election.endDate).toLocaleDateString('es-CL')],
        ['Total Votos', results.totalVotes],
    ];
    const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
    XLSX.utils.book_append_sheet(wb, infoSheet, 'Información');

    // Results sheet
    const resultsData = [
        ['Opción', 'Votos', 'Porcentaje'],
        ...results.results.map(result => [
            result.text,
            result.votes,
            `${result.percentage.toFixed(2)}%`
        ])
    ];
    const resultsSheet = XLSX.utils.aoa_to_sheet(resultsData);

    // Style headers
    resultsSheet['A1'].s = { font: { bold: true }, fill: { fgColor: { rgb: '3B82F6' } } };
    resultsSheet['B1'].s = { font: { bold: true }, fill: { fgColor: { rgb: '3B82F6' } } };
    resultsSheet['C1'].s = { font: { bold: true }, fill: { fgColor: { rgb: '3B82F6' } } };

    XLSX.utils.book_append_sheet(wb, resultsSheet, 'Resultados');

    // Save
    const filename = `resultados-${results.election.title.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
    XLSX.writeFile(wb, filename);
};

/**
 * Export election results to CSV
 */
export const exportToCSV = (results: ElectionResult) => {
    const csvContent = [
        ['Opción', 'Votos', 'Porcentaje'],
        ...results.results.map(result => [
            result.text,
            result.votes.toString(),
            `${result.percentage.toFixed(2)}%`
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados-${results.election.title.replace(/\s+/g, '-').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};
