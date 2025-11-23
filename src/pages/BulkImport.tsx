import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';

interface ImportError {
    row: number;
    error: string;
    data: {
        rut: string;
        fullName: string;
        email: string;
    };
}

interface ImportResult {
    success: boolean;
    message: string;
    created: number;
    failed: number;
    errors: ImportError[];
    credentials: Array<{
        rut: string;
        fullName: string;
        email: string;
        password: string;
    }>;
}

export default function BulkImport() {
    const { accessToken, user } = useAuthStore();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const downloadTemplate = async () => {
        try {
            const response = await fetch('/api/bulk-import/template', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) throw new Error('Error al descargar plantilla');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plantilla-importacion.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Plantilla descargada');
        } catch (error) {
            console.error('Download template error:', error);
            toast.error('Error al descargar plantilla');
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Por favor selecciona un archivo');
            return;
        }

        if (!user?.organizationId) {
            toast.error('No se pudo obtener la organización del usuario');
            return;
        }

        setImporting(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('organizationId', user.organizationId);

            const response = await fetch('/api/bulk-import/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            const data: ImportResult = await response.json();
            setResult(data);

            if (data.success) {
                if (data.created > 0) {
                    toast.success(data.message);
                } else {
                    toast.warning(data.message);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Error al importar usuarios');
        } finally {
            setImporting(false);
        }
    };

    const downloadCredentials = async () => {
        if (!result || !result.credentials || result.credentials.length === 0) {
            toast.error('No hay credenciales para descargar');
            return;
        }

        try {
            const response = await fetch('/api/bulk-import/download-credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ credentials: result.credentials }),
            });

            if (!response.ok) throw new Error('Error al descargar credenciales');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `credenciales-${Date.now()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Credenciales descargadas');
        } catch (error) {
            console.error('Download credentials error:', error);
            toast.error('Error al descargar credenciales');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <Users className="w-8 h-8 text-purple-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Importación Masiva de Votantes</h1>
                                <p className="text-gray-500 text-sm">Carga múltiples usuarios desde un archivo Excel o CSV</p>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-2">📋 Instrucciones:</h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                            <li>Descarga la plantilla de Excel haciendo clic en el botón de abajo</li>
                            <li>Completa la plantilla con los datos de los votantes (RUT, Nombre Completo, Email)</li>
                            <li>Sube el archivo completado usando el botón "Seleccionar Archivo"</li>
                            <li>Haz clic en "Importar Usuarios" para procesar el archivo</li>
                            <li>Descarga el archivo de credenciales generadas para distribuir a los votantes</li>
                        </ol>
                    </div>

                    {/* Download Template Button */}
                    <div className="mb-6">
                        <button
                            onClick={downloadTemplate}
                            className="inline-flex items-center px-4 py-2 border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar Plantilla Excel
                        </button>
                    </div>

                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Archivo de Importación
                        </label>
                        <div className="flex items-center space-x-4">
                            <label className="flex-1 flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                                <div className="text-center">
                                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-2 text-sm text-gray-600">
                                        {file ? (
                                            <span className="font-medium text-purple-600">{file.name}</span>
                                        ) : (
                                            <>
                                                <span className="font-medium text-purple-600">Haz clic para seleccionar</span>
                                                <span className="text-gray-500"> o arrastra un archivo aquí</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Excel (.xlsx, .xls) o CSV (máx. 5MB)</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Import Button */}
                    <div className="mb-6">
                        <button
                            onClick={handleImport}
                            disabled={!file || importing}
                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-5 h-5 mr-2" />
                            {importing ? 'Importando...' : 'Importar Usuarios'}
                        </button>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados de la Importación</h3>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">Creados</p>
                                            <p className="text-2xl font-bold text-green-900">{result.created}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                        <div>
                                            <p className="text-sm text-red-600 font-medium">Fallidos</p>
                                            <p className="text-2xl font-bold text-red-900">{result.failed}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <Users className="w-5 h-5 text-blue-600 mr-2" />
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Total</p>
                                            <p className="text-2xl font-bold text-blue-900">{result.created + result.failed}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Download Credentials */}
                            {result.credentials && result.credentials.length > 0 && (
                                <div className="mb-6">
                                    <button
                                        onClick={downloadCredentials}
                                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        Descargar Credenciales ({result.credentials.length} usuarios)
                                    </button>
                                    <p className="mt-2 text-sm text-gray-600 text-center">
                                        ⚠️ Importante: Descarga y guarda este archivo de forma segura. Contiene las contraseñas generadas.
                                    </p>
                                </div>
                            )}

                            {/* Errors */}
                            {result.errors && result.errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-red-900 mb-2">Errores Encontrados:</h4>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {result.errors.map((error, index) => (
                                                    <div key={index} className="text-sm text-red-800 bg-white p-2 rounded">
                                                        <p className="font-medium">Fila {error.row}: {error.error}</p>
                                                        {error.data && (
                                                            <p className="text-xs text-red-600 mt-1">
                                                                {error.data.rut} - {error.data.fullName} ({error.data.email})
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
