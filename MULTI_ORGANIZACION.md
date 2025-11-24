# Multi-Organización - Documentación

## 📋 Estado Actual

### Limitación Conocida: Una Organización por Usuario

Actualmente, el sistema está diseñado con una relación **1:1** entre Usuario y Organización.

```typescript
User {
  id: UUID
  rut: string (UNIQUE)
  email: string (UNIQUE)
  organizationId: UUID  // UN SOLO organizationId
  role: 'voter' | 'admin' | 'super_admin'
}
```

### Implicaciones

- ✅ Cada usuario pertenece a **una sola organización**
- ✅ Cada usuario ve solo las elecciones de **su organización**
- ✅ RUT y Email son únicos **globalmente** (no por organización)

---

## 🤔 Caso de Uso: Usuario en Múltiples Organizaciones

### Escenario Ejemplo

**Juan Pérez** necesita participar en votaciones de:
- 🏘️ Junta de Vecinos Villa Esperanza
- 🚒 Bomberos de Santiago

### ❌ Problema Actual

Juan solo puede tener **una cuenta** asociada a **una organización**.

### ✅ Solución Actual (Workaround)

Crear **dos cuentas separadas** con emails diferentes:

```
Cuenta 1:
- Email: juan.vecinos@email.com
- RUT: 12.345.678-9
- Organización: Junta de Vecinos Villa Esperanza

Cuenta 2:
- Email: juan.bomberos@email.com
- RUT: 12.345.678-9  ❌ NO PERMITIDO (RUT duplicado)
```

**Nota**: Actualmente el RUT es único globalmente, por lo que esta solución tiene limitaciones.

### 🔧 Solución Alternativa Temporal

Si es absolutamente necesario:
1. Usar emails diferentes
2. Usar variaciones del RUT (no recomendado)
3. Contactar al super_admin para casos especiales

---

## 🚀 Roadmap: Implementación Futura

### Diseño Propuesto: Tabla de Membresías

Cuando sea necesario implementar soporte multi-organización, se propone:

#### Nuevo Modelo de Datos

```typescript
User {
  id: UUID
  rut: string (UNIQUE)
  email: string (UNIQUE)
  fullName: string
  // Sin organizationId directo
}

UserOrganization {  // Nueva tabla de membresías
  id: UUID
  userId: UUID
  organizationId: UUID
  role: 'voter' | 'admin'
  isActive: boolean
  isPrimary: boolean
  joinedAt: Date
  
  // Índice único: (userId, organizationId)
}

// Tabla de sesión para tracking
UserSession {
  userId: UUID
  activeOrganizationId: UUID  // Organización activa en esta sesión
}
```

#### Flujo de Usuario Propuesto

```
1. Login → Juan Pérez
2. Sistema detecta múltiples organizaciones
3. Selector de Organización:
   ┌─────────────────────────────────────┐
   │ Selecciona tu organización:         │
   │                                     │
   │ ○ 🏘️ Junta de Vecinos Villa Esperanza │
   │ ○ 🚒 Bomberos de Santiago            │
   │                                     │
   │ [Continuar]                         │
   └─────────────────────────────────────┘
4. Juan selecciona "Junta de Vecinos"
5. Ve solo elecciones de Junta de Vecinos
6. Puede cambiar organización desde el menú:
   Header: [Juan Pérez] [🏘️ Junta de Vecinos ▼]
```

#### Cambios Necesarios

##### 1. Base de Datos
- [ ] Crear tabla `user_organizations`
- [ ] Migrar datos existentes de `users.organizationId` a `user_organizations`
- [ ] Actualizar foreign keys
- [ ] Agregar índices apropiados

##### 2. Backend
- [ ] Crear modelo `UserOrganization`
- [ ] Actualizar `AuthService` para manejar organización activa
- [ ] Modificar JWT para incluir `activeOrganizationId`
- [ ] Nuevo endpoint: `POST /api/auth/switch-organization`
- [ ] Nuevo endpoint: `GET /api/user/organizations`
- [ ] Actualizar middleware de autorización
- [ ] Actualizar todos los servicios que usan `user.organizationId`

##### 3. Frontend
- [ ] Selector de organización en login (si múltiples)
- [ ] Dropdown de cambio de organización en header
- [ ] Actualizar `authStore` para manejar organización activa
- [ ] Actualizar todas las páginas que dependen de `organizationId`
- [ ] Indicador visual de organización activa

##### 4. Gestión de Membresías (Admin)
- [ ] Página para gestionar membresías de usuarios
- [ ] Agregar usuario a organización
- [ ] Remover usuario de organización
- [ ] Cambiar rol de usuario en organización

#### Estimación de Esfuerzo

- **Desarrollo**: 2-3 días
- **Testing**: 1-2 días
- **Migración de datos**: 0.5 días
- **Total**: ~4-5 días de trabajo

---

## 📝 Notas de Diseño

### Consideraciones Importantes

1. **Organización Primaria**
   - Cada usuario debe tener una organización marcada como `isPrimary`
   - Se usa como default al login

2. **Cambio de Contexto**
   - El cambio de organización debe ser explícito
   - Se guarda en el token JWT
   - Requiere refresh del token

3. **Permisos**
   - Un usuario puede ser `admin` en una org y `voter` en otra
   - Los permisos se evalúan por organización activa

4. **Aislamiento de Datos**
   - Todas las queries deben filtrar por `activeOrganizationId`
   - Verificar que no haya leaks de datos entre organizaciones

5. **Super Admin**
   - `super_admin` sigue siendo global
   - Puede ver/gestionar todas las organizaciones
   - No necesita cambiar contexto

---

## 🔍 Referencias

### Archivos Relacionados

- `api/models/User.ts` - Modelo actual de usuario
- `api/services/AuthService.ts` - Servicio de autenticación
- `api/services/VotingService.ts` - Filtrado por organización
- `src/stores/authStore.ts` - Store de autenticación frontend

### Decisiones de Diseño

- **Fecha**: 2024-11-24
- **Decisión**: Mantener relación 1:1 Usuario-Organización
- **Razón**: Simplicidad, sistema funcional, no es crítico ahora
- **Revisión**: Implementar cuando sea requerimiento real de negocio

---

## ✅ Conclusión

El sistema actual funciona correctamente para el caso de uso principal (un usuario, una organización).

La implementación de multi-organización está **documentada y diseñada**, lista para implementarse cuando sea necesario.

**Próximos pasos cuando se requiera**:
1. Revisar este documento
2. Validar el diseño propuesto
3. Crear branch feature/multi-organization
4. Implementar según el plan descrito
5. Testing exhaustivo
6. Migración de datos en producción
