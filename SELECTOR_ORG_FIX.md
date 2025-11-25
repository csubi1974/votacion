# Fix para Selector de Organización

## Problema
El input muestra el nombre de la organización seleccionada, impidiendo borrar y buscar otra.

## Solución
Separar el estado de búsqueda del valor seleccionado y mostrar un display diferente cuando hay una organización seleccionada.

## Cambios necesarios en VoterRegistry.tsx

### 1. Agregar estados (después de línea 64):
```typescript
const [orgSearchTerm, setOrgSearchTerm] = useState('');
const [showOrgDropdown, setShowOrgDropdown] = useState(false);
```

### 2. Agregar organizationId a formData (línea 58-62):
```typescript
const [formData, setFormData] = useState({
    rut: '',
    fullName: '',
    email: '',
    organizationId: user?.organizationId || ''
});
const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
```

### 3. Fetch organizations en useEffect (línea 92-94):
```typescript
useEffect(() => {
    fetchVoters();
    if (user?.role === 'super_admin') {
        fetchOrganizations();
    }
}, [fetchVoters]);

const fetchOrganizations = async () => {
    try {
        const response = await fetch('/api/admin/organizations', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (response.ok) {
            const data = await response.json();
            setOrganizations(data.data);
        }
    } catch (error) {
        console.error('Error fetching organizations:', error);
    }
};
```

### 4. Actualizar handleAddVoter (línea 151-169):
Cambiar la validación de organizationId para usar formData.organizationId si el usuario es super_admin.

### 5. Actualizar todos los setFormData para incluir organizationId:
```typescript
setFormData({ rut: '', fullName: '', email: '', organizationId: user?.organizationId || '' });
```

### 6. Reemplazar el selector de organización (después del campo email):
```typescript
{/* Organization selector - only for super_admin */}
{user?.role === 'super_admin' && !existingUser && (
    <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Organización *
        </label>
        
        {/* Selected organization display or search input */}
        {formData.organizationId && !showOrgDropdown ? (
            <div className="relative">
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-between">
                    <span className="text-gray-900">
                        {organizations.find(o => o.id === formData.organizationId)?.name}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({ ...formData, organizationId: '' });
                            setOrgSearchTerm('');
                            setShowOrgDropdown(true);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="h-5 w-5" />
                    </button>
                </div>
            </div>
        ) : (
            <div className="relative">
                <input
                    type="text"
                    value={orgSearchTerm}
                    onChange={(e) => {
                        setOrgSearchTerm(e.target.value);
                        setShowOrgDropdown(true);
                    }}
                    onFocus={() => setShowOrgDropdown(true)}
                    placeholder="Buscar organización..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required={!formData.organizationId}
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
        )}
        
        {/* Dropdown */}
        {showOrgDropdown && (
            <>
                <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowOrgDropdown(false)}
                />
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {organizations
                        .filter(org => 
                            org.name.toLowerCase().includes(orgSearchTerm.toLowerCase())
                        )
                        .map(org => (
                            <div
                                key={org.id}
                                onClick={() => {
                                    setFormData({ ...formData, organizationId: org.id });
                                    setOrgSearchTerm('');
                                    setShowOrgDropdown(false);
                                }}
                                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                                    formData.organizationId === org.id ? 'bg-blue-100' : ''
                                }`}
                            >
                                {org.name}
                            </div>
                        ))
                    }
                    {organizations.filter(org => 
                        org.name.toLowerCase().includes(orgSearchTerm.toLowerCase())
                    ).length === 0 && (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                            No se encontraron organizaciones
                        </div>
                    )}
                </div>
            </>
        )}
    </div>
)}
```

## Características
- ✅ Muestra la organización seleccionada con botón X para borrar
- ✅ Al borrar, abre automáticamente el dropdown de búsqueda
- ✅ Búsqueda en tiempo real
- ✅ Click fuera para cerrar
- ✅ Solo visible para super_admin
