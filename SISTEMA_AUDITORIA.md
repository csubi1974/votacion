# 🔍 Sistema de Auditoría - VotApp

## 📋 Índice
1. [¿Qué es la Auditoría?](#qué-es-la-auditoría)
2. [Modelo de Datos](#modelo-de-datos)
3. [Cómo Funciona](#cómo-funciona)
4. [Tipos de Eventos](#tipos-de-eventos)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Consultas y Reportes](#consultas-y-reportes)
7. [Visualización en el Frontend](#visualización-en-el-frontend)

---

## 🎯 ¿Qué es la Auditoría?

El sistema de auditoría registra **TODAS las acciones importantes** que ocurren en la plataforma, creando un historial completo e inmutable de:

- ✅ **Quién** hizo la acción (userId)
- ✅ **Qué** acción realizó (action)
- ✅ **Cuándo** la realizó (createdAt)
- ✅ **Dónde** (ipAddress)
- ✅ **Sobre qué** recurso (resourceType, resourceId)
- ✅ **Qué cambió** (oldValues, newValues)

### Propósitos:
1. **Seguridad**: Detectar actividades sospechosas
2. **Compliance**: Cumplir regulaciones y auditorías externas
3. **Debugging**: Rastrear problemas y errores
4. **Transparencia**: Demostrar integridad del proceso electoral

---

## 📊 Modelo de Datos

### Tabla: `audit_logs`

```typescript
interface AuditLog {
  id: string;                    // UUID único
  userId: string;                // Usuario que realizó la acción
  action: string;                // Tipo de acción (ej: "VOTE_CAST")
  resourceType: string;          // Tipo de recurso (ej: "election")
  resourceId?: string;           // ID del recurso afectado
  oldValues?: JSON;              // Valores antes del cambio
  newValues?: JSON;              // Valores después del cambio
  ipAddress: string;             // IP desde donde se realizó
  createdAt: Date;               // Timestamp automático
}
```

### Índices para Rendimiento:
- `userId` - Buscar por usuario
- `action` - Filtrar por tipo de acción
- `resourceType + resourceId` - Auditoría de un recurso específico
- `createdAt` - Ordenar cronológicamente

---

## ⚙️ Cómo Funciona

### 1. Registro Automático

Cada vez que ocurre una acción importante, se llama a:

```typescript
await auditService.logActivity({
  userId: user.id,
  action: 'VOTE_CAST',
  resourceType: 'election',
  resourceId: electionId,
  oldValues: null,
  newValues: { optionId: selectedOptionId },
  ipAddress: req.ip
});
```

### 2. Almacenamiento

El registro se guarda en la base de datos de forma **asíncrona** para no afectar el rendimiento de la operación principal.

### 3. Consulta

Los administradores pueden consultar los logs mediante:
- Filtros (usuario, acción, fecha, recurso)
- Reportes predefinidos
- Exportación de datos

---

## 📝 Tipos de Eventos Auditados

### 🔐 Seguridad y Autenticación
```typescript
'LOGIN_SUCCESS'              // Login exitoso
'LOGIN_FAILED'               // Intento de login fallido
'LOGOUT'                     // Cierre de sesión
'PASSWORD_CHANGED'           // Cambio de contraseña
'PASSWORD_RESET_REQUESTED'   // Solicitud de reset
'PASSWORD_RESET_COMPLETED'   // Reset completado
'ACCOUNT_LOCKED'             // Cuenta bloqueada
'ACCOUNT_UNLOCKED'           // Cuenta desbloqueada
'2FA_ENABLED'                // 2FA activado
'2FA_DISABLED'               // 2FA desactivado
'2FA_VERIFICATION_SUCCESS'   // Verificación 2FA exitosa
'2FA_VERIFICATION_FAILED'    // Verificación 2FA fallida
```

### 🗳️ Votación
```typescript
'VOTE_ATTEMPT'               // Intento de voto
'VOTE_CAST'                  // Voto registrado
'VOTE_FAILED'                // Voto fallido
```

### 📋 Elecciones
```typescript
'ELECTION_CREATED'           // Elección creada
'ELECTION_UPDATED'           // Elección modificada
'ELECTION_DELETED'           // Elección eliminada
'ELECTION_STATUS_CHANGED'    // Cambio de estado
```

### 👥 Usuarios
```typescript
'USER_CREATED'               // Usuario creado
'USER_UPDATED'               // Usuario modificado
'USER_DELETED'               // Usuario eliminado
'ROLE_CHANGED'               // Cambio de rol
```

### ⚠️ Seguridad Avanzada
```typescript
'PERMISSION_DENIED'          // Acceso denegado
'SUSPICIOUS_ACTIVITY'        // Actividad sospechosa
'RATE_LIMIT_EXCEEDED'        // Límite de peticiones excedido
'CSRF_VIOLATION'             // Violación CSRF
'XSS_ATTEMPT'                // Intento de XSS
'SQL_INJECTION_ATTEMPT'      // Intento de SQL injection
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Auditar un Voto

```typescript
// En VotingService.ts
async castVote(data: VoteData): Promise<Vote[]> {
  // ... lógica de votación ...
  
  // Registrar auditoría
  await auditService.logActivity({
    userId: data.userId,
    action: 'VOTE_CAST',
    resourceType: 'election',
    resourceId: data.electionId,
    oldValues: null,
    newValues: {
      optionIds: data.optionIds,
      timestamp: new Date().toISOString()
    },
    ipAddress: data.ipAddress
  });
  
  return votes;
}
```

### Ejemplo 2: Auditar Cambio de Elección

```typescript
// En ElectionService.ts
async updateElection(electionId: string, data: UpdateData): Promise<Election> {
  const election = await Election.findByPk(electionId);
  
  // Guardar valores anteriores
  const oldValues = {
    title: election.title,
    status: election.status,
    startDate: election.startDate,
    endDate: election.endDate
  };
  
  // Actualizar
  await election.update(data);
  
  // Auditar cambio
  await auditService.logActivity({
    userId: user.id,
    action: 'ELECTION_UPDATED',
    resourceType: 'election',
    resourceId: electionId,
    oldValues,
    newValues: data,
    ipAddress: req.ip
  });
  
  return election;
}
```

### Ejemplo 3: Auditar Login Fallido

```typescript
// En AuthService.ts
async login(data: LoginData): Promise<AuthResponse> {
  const user = await User.findOne({ where: { rut: data.rut } });
  
  if (!user || !isPasswordValid) {
    // Registrar intento fallido
    await auditService.logActivity({
      userId: user?.id || 'unknown',
      action: 'LOGIN_FAILED',
      resourceType: 'user',
      resourceId: user?.id,
      oldValues: null,
      newValues: { rut: data.rut },
      ipAddress: req.ip
    });
    
    return { success: false, message: 'Invalid credentials' };
  }
  
  // Login exitoso
  await auditService.logActivity({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    resourceType: 'user',
    resourceId: user.id,
    oldValues: null,
    newValues: null,
    ipAddress: req.ip
  });
  
  return { success: true, user, tokens };
}
```

---

## 📊 Consultas y Reportes

### 1. Obtener Logs con Filtros

```typescript
const { logs, total } = await auditService.getAuditLogs({
  userId: 'user-uuid',           // Filtrar por usuario
  action: 'VOTE_CAST',           // Filtrar por acción
  resourceType: 'election',      // Filtrar por tipo de recurso
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 50,
  offset: 0
});
```

### 2. Eventos de Seguridad

```typescript
// Obtener últimos 100 eventos de seguridad
const securityEvents = await auditService.getSecurityEvents(100);

// Incluye: logins, cambios de contraseña, 2FA, etc.
```

### 3. Actividad Sospechosa

```typescript
// Detectar actividad sospechosa
const suspicious = await auditService.getSuspiciousActivity(50);

// Incluye: intentos fallidos, rate limiting, CSRF, XSS, etc.
```

### 4. Auditoría de una Elección

```typescript
// Ver todo lo que pasó con una elección específica
const trail = await auditService.getElectionAuditTrail(electionId);

// Muestra: creación, modificaciones, votos, cambios de estado
```

### 5. Actividad de un Usuario

```typescript
// Ver todo lo que hizo un usuario
const userActivity = await auditService.getUserActivity(userId, 50);
```

### 6. Reporte Completo

```typescript
const report = await auditService.generateAuditReport(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// Retorna:
// - Resumen de actividades
// - Top acciones
// - Top usuarios
// - Eventos de seguridad
// - Actividad sospechosa
```

---

## 🖥️ Visualización en el Frontend

### Página: `/admin/audit-logs`

Los administradores pueden:

1. **Ver logs en tiempo real**
   - Lista paginada de todos los eventos
   - Información del usuario que realizó la acción
   - Timestamp preciso
   - IP de origen

2. **Filtrar logs**
   - Por usuario
   - Por tipo de acción
   - Por rango de fechas
   - Por tipo de recurso

3. **Ver detalles**
   - Valores anteriores (oldValues)
   - Valores nuevos (newValues)
   - Información completa del evento

4. **Exportar**
   - Descargar logs filtrados
   - Generar reportes

### Componente: `AuditLogs.tsx`

```tsx
// Ejemplo de visualización
<div className="audit-log-entry">
  <div className="user-info">
    <Avatar user={log.user} />
    <span>{log.user.fullName}</span>
  </div>
  
  <div className="action-badge">
    {getActionBadge(log.action)}
  </div>
  
  <div className="details">
    <p>Recurso: {log.resourceType}</p>
    <p>IP: {log.ipAddress}</p>
    <time>{formatDate(log.createdAt)}</time>
  </div>
  
  {log.oldValues && (
    <DiffViewer 
      oldValues={log.oldValues}
      newValues={log.newValues}
    />
  )}
</div>
```

---

## 🔒 Seguridad del Sistema de Auditoría

### Características de Seguridad:

1. **Inmutabilidad**
   - Los logs NO se pueden editar
   - Solo se pueden crear
   - Eliminación requiere permisos especiales

2. **Integridad**
   - Timestamps automáticos
   - IDs únicos (UUID)
   - Relaciones con usuarios verificadas

3. **Acceso Restringido**
   - Solo admins y super_admins pueden ver logs
   - Filtrado por organización para admins
   - Super_admin ve todo

4. **Rendimiento**
   - Escritura asíncrona (no bloquea operaciones)
   - Índices optimizados para consultas rápidas
   - Paginación en consultas

---

## 📈 Casos de Uso Reales

### 1. Investigar un Problema de Votación

```
Usuario reporta: "No pude votar"

Admin busca en audit logs:
- Filtrar por userId
- Buscar acciones VOTE_*
- Ver detalles del error
- Identificar causa (ej: no estaba en padrón)
```

### 2. Detectar Intento de Fraude

```
Sistema detecta:
- Múltiples intentos de voto desde misma IP
- Intentos de acceso no autorizado
- Cambios sospechosos en elecciones

Admin revisa:
- Actividad sospechosa
- IPs involucradas
- Usuarios afectados
- Toma acción (bloquear, investigar)
```

### 3. Auditoría Externa

```
Auditor externo solicita:
- Reporte de todas las elecciones del año
- Historial de cambios en elección X
- Verificación de integridad de votos

Admin genera:
- Reporte completo con generateAuditReport()
- Exporta a PDF/Excel
- Demuestra transparencia del proceso
```

### 4. Cumplimiento Regulatorio

```
Regulación requiere:
- Registro de todos los accesos
- Historial de cambios de datos
- Retención de logs por X años

Sistema provee:
- Logs completos e inmutables
- Exportación para archivo
- Búsqueda y filtrado eficiente
```

---

## 🎯 Mejores Prácticas

### ✅ DO (Hacer):
1. **Auditar acciones críticas** (votos, cambios de elección, accesos)
2. **Incluir contexto suficiente** (oldValues, newValues)
3. **Capturar IP address** para rastreo
4. **Usar acciones descriptivas** ('VOTE_CAST' no 'action1')
5. **Revisar logs regularmente** para detectar patrones

### ❌ DON'T (No Hacer):
1. **No auditar acciones triviales** (cada click, cada vista)
2. **No guardar contraseñas** en oldValues/newValues
3. **No bloquear operaciones** si falla el logging
4. **No permitir edición** de logs existentes
5. **No ignorar actividad sospechosa**

---

## 📚 Resumen

El sistema de auditoría de VotApp es:

- ✅ **Completo**: Registra todas las acciones importantes
- ✅ **Seguro**: Inmutable y con acceso restringido
- ✅ **Eficiente**: No afecta el rendimiento
- ✅ **Útil**: Facilita debugging, seguridad y compliance
- ✅ **Transparente**: Demuestra integridad del proceso

**Es una pieza fundamental** para la confianza en el sistema electoral.
