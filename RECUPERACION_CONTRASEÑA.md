# 🔐 Sistema de Recuperación de Contraseña

## ✅ Implementación Completa

### **Backend**

#### 1. **Modelo de Datos**
- ✅ `PasswordResetToken` model creado
- ✅ Campos: id, userId, token (hashed), expiresAt, used
- ✅ Métodos: `isExpired()`, `isValid()`
- ✅ Asociaciones con User model
- ✅ Índices para optimización

#### 2. **Endpoints API**

**POST /api/auth/forgot-password**
- Recibe: `{ email: string }`
- Genera token de recuperación (expira en 1 hora)
- Token hasheado con SHA-256 para seguridad
- Previene enumeración de emails (siempre retorna success)
- Logs del reset URL en consola (para desarrollo)

**POST /api/auth/reset-password**
- Recibe: `{ token: string, password: string }`
- Valida token (existencia, expiración, uso previo)
- Valida contraseña (requisitos de complejidad)
- Actualiza contraseña del usuario
- Marca token como usado
- Registra evento en auditoría

### **Frontend**

#### 3. **Páginas**

**ForgotPassword** (`/forgot-password`)
- Formulario de solicitud de recuperación
- Validación de email
- Estado de loading
- Pantalla de confirmación post-envío
- Links a login y registro

**ResetPassword** (`/reset-password?token=xxx`)
- Validación automática de token desde URL
- Formulario de nueva contraseña
- Indicador de fortaleza de contraseña
- Validación en tiempo real
- Confirmación de contraseña
- Pantalla de éxito
- Redirección automática a login

#### 4. **Integración**
- ✅ Link "¿Olvidaste tu contraseña?" en página de login
- ✅ Rutas agregadas en App.tsx
- ✅ Navegación completa entre páginas

### **Seguridad**

- ✅ Tokens hasheados (SHA-256)
- ✅ Expiración de tokens (1 hora)
- ✅ Tokens de un solo uso
- ✅ Prevención de enumeración de emails
- ✅ Validación de contraseña robusta
- ✅ Auditoría de cambios de contraseña
- ✅ Rate limiting (heredado de auth routes)

---

## 🚀 Cómo Usar

### **Para Usuarios**

1. **Olvidé mi contraseña:**
   - Ve a `/login`
   - Click en "¿Olvidaste tu contraseña?"
   - Ingresa tu email
   - Revisa tu email (o consola en desarrollo)

2. **Resetear contraseña:**
   - Click en el link del email
   - Ingresa nueva contraseña (mínimo 8 caracteres, mayúscula, minúscula, número, carácter especial)
   - Confirma la contraseña
   - Click en "Actualizar Contraseña"
   - Inicia sesión con la nueva contraseña

### **Para Desarrollo**

1. **Probar el sistema:**
   ```bash
   # Ejecutar script de prueba
   npx tsx api/scripts/test-password-reset.ts
   ```

2. **Solicitar reset:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@voting-platform.com"}'
   ```

3. **Verificar en consola:**
   - El servidor mostrará el reset URL en la consola
   - Copiar y pegar en el navegador

4. **Resetear contraseña:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token":"TOKEN_AQUI","password":"NuevaPassword123!"}'
   ```

---

## 📊 Base de Datos

### **Nueva Tabla: password_reset_tokens**

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt DATETIME NOT NULL,
  used BOOLEAN DEFAULT false,
  createdAt DATETIME,
  updatedAt DATETIME
);

CREATE INDEX idx_password_reset_tokens_userId ON password_reset_tokens(userId);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expiresAt ON password_reset_tokens(expiresAt);
```

---

## 🔄 Flujo Completo

```
Usuario olvida contraseña
    ↓
Ingresa email en /forgot-password
    ↓
Backend genera token y lo hashea
    ↓
Token guardado en DB con expiración
    ↓
Email enviado con link (en desarrollo: console.log)
    ↓
Usuario click en link
    ↓
Redirige a /reset-password?token=xxx
    ↓
Usuario ingresa nueva contraseña
    ↓
Backend valida token y contraseña
    ↓
Contraseña actualizada
    ↓
Token marcado como usado
    ↓
Evento registrado en auditoría
    ↓
Usuario redirigido a login
```

---

## 📝 Notas Importantes

### **Producción**
- ⚠️ Configurar servicio de email (nodemailer, SendGrid, etc.)
- ⚠️ Actualizar `FRONTEND_URL` en variables de entorno
- ⚠️ Considerar aumentar/disminuir tiempo de expiración según necesidad
- ⚠️ Implementar limpieza automática de tokens expirados

### **Email Service (TODO)**
```typescript
// Ejemplo de integración con nodemailer
import nodemailer from 'nodemailer';

const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: '"Plataforma de Votación" <noreply@voting-platform.com>',
    to: email,
    subject: 'Recuperación de Contraseña',
    html: `
      <h1>Recuperación de Contraseña</h1>
      <p>Has solicitado resetear tu contraseña.</p>
      <p>Click en el siguiente link para continuar:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Este link expirará en 1 hora.</p>
      <p>Si no solicitaste este cambio, ignora este email.</p>
    `,
  });
};
```

---

## ✨ Características Adicionales Implementadas

1. **UX Mejorada:**
   - Indicador de fortaleza de contraseña
   - Validación en tiempo real
   - Mensajes de error específicos
   - Estados de loading
   - Pantallas de confirmación

2. **Seguridad:**
   - Tokens hasheados
   - Expiración automática
   - Un solo uso por token
   - Prevención de timing attacks
   - Auditoría completa

3. **Desarrollo:**
   - Logs detallados en consola
   - Script de prueba
   - Documentación completa

---

## 🎯 Testing

### **Casos de Prueba**

1. ✅ Usuario solicita reset con email válido
2. ✅ Usuario solicita reset con email inválido
3. ✅ Token expira después de 1 hora
4. ✅ Token no puede usarse dos veces
5. ✅ Contraseña debe cumplir requisitos
6. ✅ Contraseñas deben coincidir
7. ✅ Token inválido rechazado
8. ✅ Evento registrado en auditoría

---

## 📚 Archivos Creados/Modificados

### **Backend**
- ✅ `api/models/PasswordResetToken.ts` (nuevo)
- ✅ `api/models/index.ts` (modificado)
- ✅ `api/routes/auth.ts` (modificado)
- ✅ `api/init-db.ts` (modificado)
- ✅ `api/scripts/test-password-reset.ts` (nuevo)

### **Frontend**
- ✅ `src/pages/ForgotPassword.tsx` (nuevo)
- ✅ `src/pages/ResetPassword.tsx` (nuevo)
- ✅ `src/pages/Login.tsx` (modificado)
- ✅ `src/App.tsx` (modificado)

---

## 🎉 ¡Sistema Completo y Funcional!

El sistema de recuperación de contraseña está completamente implementado y listo para usar.
En desarrollo, los reset URLs se mostrarán en la consola del servidor.
Para producción, solo falta configurar el servicio de email.
