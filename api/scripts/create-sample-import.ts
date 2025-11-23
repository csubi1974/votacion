import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Create sample data
const sampleData = [
    {
        RUT: '12.345.678-9',
        'Nombre Completo': 'Juan Pérez González',
        Email: 'juan.perez@example.com',
        Organización: 'org-123',
    },
    {
        RUT: '98.765.432-1',
        'Nombre Completo': 'María García López',
        Email: 'maria.garcia@example.com',
        Organización: 'org-123',
    },
    {
        RUT: '11.222.333-4',
        'Nombre Completo': 'Pedro Rodríguez Silva',
        Email: 'pedro.rodriguez@example.com',
        Organización: 'org-123',
    },
    {
        RUT: '22.333.444-5',
        'Nombre Completo': 'Ana Martínez Torres',
        Email: 'ana.martinez@example.com',
        Organización: 'org-123',
    },
    {
        RUT: '33.444.555-6',
        'Nombre Completo': 'Carlos López Fernández',
        Email: 'carlos.lopez@example.com',
        Organización: 'org-123',
    },
];

// Create worksheet
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Create workbook
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Votantes');

// Write to file
const outputPath = path.join(process.cwd(), 'ejemplo-importacion-votantes.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Archivo de ejemplo creado: ${outputPath}`);
console.log(`\nContiene ${sampleData.length} votantes de prueba.`);
console.log('\nPuedes usar este archivo para probar la importación masiva.');
