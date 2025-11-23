import * as XLSX from 'xlsx';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/security.js';
import { validateRut } from '../utils/validation.js';
import { v4 as uuidv4 } from 'uuid';

interface ImportRow {
    rut: string;
    fullName: string;
    email: string;
    organizationId?: string;
}

interface ImportResult {
    success: boolean;
    message: string;
    created: number;
    failed: number;
    errors: Array<{ row: number; error: string; data: ImportRow }>;
    credentials: Array<{ rut: string; fullName: string; email: string; password: string }>;
}

export class BulkImportService {
    /**
     * Generate a secure random password
     */
    private generatePassword(): string {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';

        // Ensure at least one of each type
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
        password += '0123456789'[Math.floor(Math.random() * 10)];
        password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

        // Fill the rest
        for (let i = password.length; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }

        // Shuffle
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    /**
     * Parse Excel/CSV file
     */
    private parseFile(buffer: Buffer, filename: string): ImportRow[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json<any>(sheet);

        return data.map((row: any) => ({
            rut: String(row.RUT || row.rut || '').trim(),
            fullName: String(row['Nombre Completo'] || row.fullName || row.nombre || '').trim(),
            email: String(row.Email || row.email || row.correo || '').trim(),
            organizationId: String(row.Organización || row.organizationId || row.organizacion || '').trim() || undefined,
        }));
    }

    /**
     * Validate import row
     */
    private validateRow(row: ImportRow, rowNumber: number): string | null {
        if (!row.rut) {
            return `Fila ${rowNumber}: RUT es requerido`;
        }

        if (!validateRut(row.rut)) {
            return `Fila ${rowNumber}: RUT inválido (${row.rut})`;
        }

        if (!row.fullName || row.fullName.length < 3) {
            return `Fila ${rowNumber}: Nombre completo es requerido (mínimo 3 caracteres)`;
        }

        if (!row.email) {
            return `Fila ${rowNumber}: Email es requerido`;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
            return `Fila ${rowNumber}: Email inválido (${row.email})`;
        }

        return null;
    }

    /**
     * Import users from Excel/CSV file
     */
    async importUsers(
        buffer: Buffer,
        filename: string,
        defaultOrganizationId: string
    ): Promise<ImportResult> {
        const result: ImportResult = {
            success: true,
            message: '',
            created: 0,
            failed: 0,
            errors: [],
            credentials: [],
        };

        try {
            // Parse file
            const rows = this.parseFile(buffer, filename);

            if (rows.length === 0) {
                return {
                    ...result,
                    success: false,
                    message: 'El archivo está vacío o no tiene el formato correcto',
                };
            }

            // Process each row
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowNumber = i + 2; // +2 because Excel is 1-indexed and has header row

                // Validate row
                const validationError = this.validateRow(row, rowNumber);
                if (validationError) {
                    result.failed++;
                    result.errors.push({ row: rowNumber, error: validationError, data: row });
                    continue;
                }

                // Check if user already exists
                const existingUser = await User.findOne({
                    where: { rut: row.rut },
                });

                if (existingUser) {
                    result.failed++;
                    result.errors.push({
                        row: rowNumber,
                        error: `Usuario con RUT ${row.rut} ya existe`,
                        data: row,
                    });
                    continue;
                }

                // Check if email already exists
                const existingEmail = await User.findOne({
                    where: { email: row.email },
                });

                if (existingEmail) {
                    result.failed++;
                    result.errors.push({
                        row: rowNumber,
                        error: `Email ${row.email} ya está registrado`,
                        data: row,
                    });
                    continue;
                }

                // Generate password
                const password = this.generatePassword();
                const passwordHash = await hashPassword(password);

                // Create user
                try {
                    await User.create({
                        id: uuidv4(),
                        rut: row.rut,
                        email: row.email,
                        fullName: row.fullName,
                        passwordHash,
                        organizationId: row.organizationId || defaultOrganizationId,
                        role: 'voter',
                        emailVerified: true, // Auto-verify for bulk imports
                    } as any);

                    result.created++;
                    result.credentials.push({
                        rut: row.rut,
                        fullName: row.fullName,
                        email: row.email,
                        password,
                    });
                } catch (error) {
                    result.failed++;
                    result.errors.push({
                        row: rowNumber,
                        error: `Error al crear usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                        data: row,
                    });
                }
            }

            // Set final message
            if (result.created > 0 && result.failed === 0) {
                result.message = `✅ ${result.created} usuarios importados exitosamente`;
            } else if (result.created > 0 && result.failed > 0) {
                result.message = `⚠️ ${result.created} usuarios importados, ${result.failed} fallaron`;
            } else {
                result.success = false;
                result.message = `❌ No se pudo importar ningún usuario (${result.failed} errores)`;
            }

            return result;
        } catch (error) {
            console.error('Bulk import error:', error);
            return {
                ...result,
                success: false,
                message: `Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            };
        }
    }

    /**
     * Generate credentials Excel file
     */
    generateCredentialsFile(credentials: Array<{ rut: string; fullName: string; email: string; password: string }>): Buffer {
        const worksheet = XLSX.utils.json_to_sheet(
            credentials.map((c) => ({
                RUT: c.rut,
                'Nombre Completo': c.fullName,
                Email: c.email,
                'Contraseña': c.password,
            }))
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Credenciales');

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
}
