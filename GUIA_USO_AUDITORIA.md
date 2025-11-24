# 📖 Guía de Uso - Sistema de Auditoría

## ✅ Estado: COMPLETAMENTE DESARROLLADO

La funcionalidad de auditoría está **100% implementada y funcional** en VotApp.

---

## 🚀 Cómo Acceder

### Paso 1: Iniciar Sesión como Admin

Debes tener rol de **admin** o **super_admin** para acceder a los logs de auditoría.

**Usuarios de prueba:**
- **Super Admin**: RUT `11.111.111-1` / Contraseña `Admin123!`
- **Admin**: RUT `22.222.222-2` / Contraseña `Admin123!`

### Paso 2: Navegar a Auditoría

Una vez logueado, en el menú lateral izquierdo verás:

```
Panel Admin
├── Dashboard
├── Organizaciones (solo super_admin)
├── Usuarios
├── Importar Usuarios
├── Elecciones
├── 📋 Auditoría  ← AQUÍ
└── Configuración (solo super_admin)
```

**URL directa**: `http://localhost:5173/admin/audit`

---

## 🎯 Funcionalidades Disponibles

### 1. **Ver Todos los Registros**

Al entrar, verás una tabla con:
- ✅ **Fecha/Hora**: Cuándo ocurrió la acción
- ✅ **Usuario**: Quién la realizó (nombre y email)
- ✅ **Acción**: Qué hizo (con badge de color)
- ✅ **Recurso**: Sobre qué (tipo y ID)
- ✅ **IP**: Desde dónde

### 2. **Filtrar Registros**

Puedes filtrar por:

#### Acción:
- Login Exitoso
- Login Fallido
- Logout
- Voto Emitido
- Elección Creada
- Usuario Creado
- Y más...

#### Tipo de Recurso:
- Usuario
- Elección
- Voto
- Organización

#### Rango de Fechas:
- Fecha Desde
- Fecha Hasta

### 3. **Exportar a CSV**

Botón **"Exportar CSV"** en la parte superior derecha:
- Descarga todos los registros filtrados
- Formato: CSV (Excel compatible)
- Nombre: `audit-logs-YYYY-MM-DD.csv`

### 4. **Paginación**

- Muestra 50 registros por página
- Botón "Cargar más" al final
- Contador total de registros

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Ver Todos los Logins del Día

1. Ir a **Auditoría**
2. Filtrar por:
   - **Acción**: "Login Exitoso"
   - **Fecha Desde**: Hoy
   - **Fecha Hasta**: Hoy
3. Ver resultados

### Ejemplo 2: Rastrear Actividad de un Usuario

1. Ir a **Auditoría**
2. En la tabla, buscar visualmente al usuario
3. Ver todas sus acciones
4. Exportar a CSV si necesitas más análisis

### Ejemplo 3: Auditar una Elección

1. Ir a **Auditoría**
2. Filtrar por:
   - **Tipo de Recurso**: "Elección"
3. Buscar el ID de la elección en la columna "Recurso"
4. Ver quién la creó, modificó, etc.

### Ejemplo 4: Detectar Intentos de Acceso Fallidos

1. Ir a **Auditoría**
2. Filtrar por:
   - **Acción**: "Login Fallido"
3. Ver IPs sospechosas
4. Identificar patrones de ataque

### Ejemplo 5: Verificar Votos de un Día

1. Ir a **Auditoría**
2. Filtrar por:
   - **Acción**: "Voto Emitido"
   - **Fecha Desde**: Día de la elección
   - **Fecha Hasta**: Día de la elección
3. Exportar CSV para análisis

---

## 🎨 Interfaz Visual

### Colores de Badges (Acciones):

- 🔴 **Rojo**: Acciones fallidas o denegadas
  - `LOGIN_FAILED`, `PERMISSION_DENIED`
  
- 🟢 **Verde**: Acciones exitosas o creaciones
  - `LOGIN_SUCCESS`, `ELECTION_CREATED`
  
- 🔵 **Azul**: Actualizaciones
  - `ELECTION_UPDATED`, `USER_UPDATED`
  
- 🟠 **Naranja**: Eliminaciones
  - `ELECTION_DELETED`, `USER_DELETED`
  
- ⚪ **Gris**: Otras acciones
  - `LOGOUT`, `VOTE_CAST`

---

## 📊 Datos que se Registran Automáticamente

### Eventos de Autenticación:
- ✅ Login exitoso/fallido
- ✅ Logout
- ✅ Cambio de contraseña
- ✅ Activación/desactivación de 2FA
- ✅ Bloqueo de cuenta

### Eventos de Votación:
- ✅ Intento de voto
- ✅ Voto registrado
- ✅ Voto fallido

### Eventos de Elecciones:
- ✅ Creación de elección
- ✅ Modificación de elección
- ✅ Eliminación de elección
- ✅ Cambio de estado

### Eventos de Usuarios:
- ✅ Creación de usuario
- ✅ Modificación de usuario
- ✅ Eliminación de usuario
- ✅ Cambio de rol

### Eventos de Seguridad:
- ✅ Acceso denegado
- ✅ Rate limiting
- ✅ Actividad sospechosa
- ✅ Violaciones CSRF

---

## 🔒 Permisos de Acceso

### Super Admin:
- ✅ Ve **TODOS** los logs de **TODAS** las organizaciones
- ✅ Sin restricciones

### Admin:
- ✅ Ve solo logs de **SU organización**
- ✅ Filtrado automático por organizationId

### Voter:
- ❌ **NO tiene acceso** a auditoría
- Solo puede ver su propio perfil

---

## 🛠️ Casos de Uso Reales

### 1. Investigación de Problema

**Escenario**: Usuario reporta que no pudo votar

**Pasos**:
1. Ir a Auditoría
2. Buscar al usuario en la tabla
3. Filtrar por "Voto"
4. Ver el error específico
5. Resolver el problema

### 2. Auditoría de Seguridad

**Escenario**: Revisar accesos del mes

**Pasos**:
1. Ir a Auditoría
2. Filtrar por "Login Exitoso"
3. Rango: Primer día del mes - Último día
4. Exportar CSV
5. Analizar en Excel

### 3. Verificación de Integridad

**Escenario**: Auditor externo solicita evidencia

**Pasos**:
1. Ir a Auditoría
2. Filtrar por elección específica
3. Exportar CSV
4. Entregar reporte con:
   - Quién creó la elección
   - Quién la modificó
   - Cuántos votos se registraron
   - Timestamps de todo

### 4. Detección de Fraude

**Escenario**: Sospecha de múltiples votos

**Pasos**:
1. Ir a Auditoría
2. Filtrar por "Voto Emitido"
3. Revisar IPs
4. Identificar patrones sospechosos
5. Tomar acción

---

## 📱 Responsive

La interfaz funciona perfectamente en:
- ✅ Desktop (mejor experiencia)
- ✅ Tablet
- ✅ Móvil

---

## ⚡ Rendimiento

- **Carga inicial**: ~50 registros
- **Paginación**: Carga 50 más al hacer click
- **Filtros**: Aplican en tiempo real
- **Exportación**: Instantánea para <1000 registros

---

## 🎯 Tips y Mejores Prácticas

### ✅ DO (Hacer):

1. **Revisar logs regularmente**
   - Al menos una vez por semana
   - Después de cada elección importante

2. **Exportar logs importantes**
   - Guardar CSV de elecciones críticas
   - Mantener evidencia para auditorías

3. **Buscar patrones**
   - Múltiples intentos fallidos
   - Accesos desde IPs inusuales
   - Actividad fuera de horario

4. **Usar filtros combinados**
   - Acción + Fecha para análisis específico
   - Recurso + Usuario para rastreo

### ❌ DON'T (No Hacer):

1. **No ignorar logs de seguridad**
   - Logins fallidos repetidos = posible ataque
   - Permisos denegados = problema de configuración

2. **No depender solo de memoria**
   - Los logs son la fuente de verdad
   - Siempre verificar en auditoría

3. **No eliminar logs**
   - Son inmutables por diseño
   - Necesarios para compliance

---

## 🔍 Troubleshooting

### Problema: No veo ningún registro

**Solución**:
1. Verificar que eres admin o super_admin
2. Limpiar filtros (botón "Limpiar filtros")
3. Verificar que hay actividad en el sistema

### Problema: No puedo exportar

**Solución**:
1. Verificar que hay registros en la tabla
2. Revisar permisos del navegador para descargas
3. Intentar con menos filtros

### Problema: Carga muy lento

**Solución**:
1. Aplicar filtros para reducir resultados
2. Usar rangos de fecha más específicos
3. Cargar de a poco con paginación

---

## 📞 Soporte

Si encuentras problemas:
1. Revisar la consola del navegador (F12)
2. Verificar que el backend está corriendo
3. Revisar logs del servidor
4. Contactar al administrador del sistema

---

## ✅ Resumen

La auditoría en VotApp es:
- ✅ **Completa**: Registra todo lo importante
- ✅ **Fácil de usar**: Interfaz intuitiva
- ✅ **Potente**: Filtros y exportación
- ✅ **Segura**: Acceso restringido
- ✅ **Confiable**: Inmutable y verificable

**¡Está lista para usar ahora mismo!**

Simplemente:
1. Login como admin
2. Click en "Auditoría" en el menú
3. Explorar los registros

🎉 **¡Disfruta de la transparencia total!**
