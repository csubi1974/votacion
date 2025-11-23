import * as XLSX from 'xlsx';
import * as path from 'path';

// Helper to calculate DV
const calculateDv = (rutBody: number) => {
    let suma = 0;
    let multiplicador = 2;
    let rutStr = rutBody.toString();

    for (let i = rutStr.length - 1; i >= 0; i--) {
        suma += parseInt(rutStr.charAt(i)) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = suma % 11;
    const dv = 11 - resto;

    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
};

// Generate valid RUTs
const generateValidRut = (rutBody: number): string => {
    const dv = calculateDv(rutBody);
    const rutStr = rutBody.toString();
    return `${rutStr.substring(0, 2)}.${rutStr.substring(2, 5)}.${rutStr.substring(5, 8)}-${dv}`;
};

// Create sample data with VALID RUTs and correct organization ID
const sampleData = [
    {
        RUT: generateValidRut(12345678),
        'Nombre Completo': 'Juan Pérez González',
        Email: 'juan.perez@example.com',
        Organización: 'e91b86cf-41b0-4110-b259-269a1aede2a5',
    },
    {
        RUT: generateValidRut(98765432),
        'Nombre Completo': 'María García López',
        Email: 'maria.garcia@example.com',
        Organización: 'e91b86cf-41b0-4110-b259-269a1aede2a5',
    },
    {
        RUT: generateValidRut(11222333),
        'Nombre Completo': 'Pedro Rodríguez Silva',
        Email: 'pedro.rodriguez@example.com',
        Organización: 'e91b86cf-41b0-4110-b259-269a1aede2a5',
    },
    {
        RUT: generateValidRut(22333444),
        'Nombre Completo': 'Ana Martínez Torres',
        Email: 'ana.martinez@example.com',
        Organización: 'e91b86cf-41b0-4110-b259-269a1aede2a5',
    },
    {
        RUT: generateValidRut(33444555),
        'Nombre Completo': 'Carlos López Fernández',
        Email: 'carlos.lopez@example.com',
        Organización: 'e91b86cf-41b0-4110-b259-269a1aede2a5',
    },
];

console.log('RUTs válidos generados:');
sampleData.forEach(row => console.log(`  ${row['Nombre Completo']}: ${row.RUT}`));

// Create worksheet
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Create workbook
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Votantes');

// Write to file
const outputPath = path.join(process.cwd(), 'votantes-importar.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`\n✅ Archivo creado: ${outputPath}`);
console.log(`\nContiene ${sampleData.length} votantes con RUTs válidos y organización correcta.`);
console.log('\n🎯 Usa este archivo para importar.');
