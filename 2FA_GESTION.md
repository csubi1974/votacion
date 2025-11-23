# 🔐 Sistema de Gestión de 2FA desde el Perfil

## ✅ Estado Actual

### **Implementado:**
1. ✅ Sección de 2FA en la pestaña "Seguridad" del perfil
2. ✅ Indicador visual del estado (Activo/Inactivo)
3. ✅ Botones para Activar/Desactivar 2FA
4. ✅ Instalada librería `qrcode.react`

### **Pendiente de Implementar:**

## 🎯 **Componentes Necesarios**

### **1. Modal de Activación de 2FA**
Componente que muestra:
- QR Code para escanear con Google Authenticator
- Código secreto manual (por si no puede escanear)
- Campo para ingresar código de verificación
- Códigos de recuperación (backup codes)
- Botón para confirmar activación

### **2. Modal de Desactivación de 2FA**
Componente que solicita:
- Código 2FA actual para confirmar
- Contraseña del usuario
- Confirmación de desactivación

### **3. Backend Endpoints**

#### **POST /api/auth/2fa/setup**
- Genera secreto 2FA
- Retorna QR code URL y códigos de recuperación
- Requiere autenticación

#### **POST /api/auth/2fa/enable**
- Verifica código 2FA
- Activa 2FA en la cuenta
- Guarda códigos de recuperación

#### **POST /api/auth/2fa/disable**
- Verifica código 2FA o contraseña
- Desactiva 2FA
- Invalida códigos de recuperación

#### **GET /api/auth/2fa/recovery-codes**
- Obtiene códigos de recuperación actuales
- Solo si 2FA está activo

#### **POST /api/auth/2fa/regenerate-codes**
- Genera nuevos códigos de recuperación
- Invalida los anteriores

---

## 🔧 **Implementación Simplificada**

Dado que la implementación completa es extensa, aquí está el enfoque recomendado:

### **Opción 1: Implementación Básica (Recomendada)**
Usar el sistema 2FA existente que ya está en el backend:
- El backend ya tiene `twoFactorSecret` en el modelo User
- Ya existe verificación de 2FA en el login
- Solo falta la UI para activar/desactivar

### **Opción 2: Implementación Completa**
Incluir todas las características:
- QR Code
- Códigos de recuperación
- Regeneración de códigos
- Historial de uso

---

## 📝 **Pasos para Implementación Básica**

### **1. Backend - Endpoints Mínimos**

```typescript
// api/routes/auth.ts

// Setup 2FA - Genera secreto y QR
router.post('/2fa/setup', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const user = await User.findByPk(userId);
  
  const speakeasy = require('speakeasy');
  const secret = speakeasy.generateSecret({
    name: `Voting Platform (${user.email})`,
  });
  
  // Guardar temporalmente (no activar aún)
  await user.update({ twoFactorSecret: secret.base32 });
  
  res.json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
    },
  });
});

// Enable 2FA - Verifica código y activa
router.post('/2fa/enable', authenticateToken, async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;
  const user = await User.findByPk(userId);
  
  const speakeasy = require('speakeasy');
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
  });
  
  if (!verified) {
    return res.status(400).json({
      success: false,
      message: 'Código inválido',
    });
  }
  
  await user.update({ twoFactorEnabled: true });
  
  res.json({
    success: true,
    message: '2FA activado exitosamente',
  });
});

// Disable 2FA
router.post('/2fa/disable', authenticateToken, async (req, res) => {
  const { code, password } = req.body;
  const userId = req.user.id;
  const user = await User.findByPk(userId);
  
  // Verificar código 2FA o contraseña
  const speakeasy = require('speakeasy');
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
  });
  
  if (!verified) {
    // Verificar contraseña como alternativa
    const { comparePassword } = await import('../utils/security.js');
    const validPassword = await comparePassword(password, user.passwordHash);
    
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: 'Código o contraseña inválidos',
      });
    }
  }
  
  await user.update({
    twoFactorEnabled: false,
    twoFactorSecret: null,
  });
  
  res.json({
    success: true,
    message: '2FA desactivado exitosamente',
  });
});
```

### **2. Frontend - Modal de Activación**

```typescript
// Agregar estados en UserProfile.tsx
const [show2FAModal, setShow2FAModal] = useState(false);
const [qrCodeUrl, setQrCodeUrl] = useState('');
const [secret, setSecret] = useState('');
const [verificationCode, setVerificationCode] = useState('');

// Función para iniciar setup
const handleEnable2FA = async () => {
  try {
    const csrfResponse = await fetch('/api/csrf-token');
    const csrfData = await csrfResponse.json();
    
    const response = await fetch('/api/auth/2fa/setup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-CSRF-Token': csrfData.csrfToken,
      },
    });
    
    const data = await response.json();
    setQrCodeUrl(data.data.qrCode);
    setSecret(data.data.secret);
    setShow2FAModal(true);
  } catch (error) {
    toast.error('Error al configurar 2FA');
  }
};

// Función para confirmar activación
const handleConfirmEnable2FA = async () => {
  try {
    const csrfResponse = await fetch('/api/csrf-token');
    const csrfData = await csrfResponse.json();
    
    const response = await fetch('/api/auth/2fa/enable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-CSRF-Token': csrfData.csrfToken,
      },
      body: JSON.stringify({ code: verificationCode }),
    });
    
    if (response.ok) {
      toast.success('2FA activado exitosamente');
      updateUser({ twoFactorEnabled: true });
      setShow2FAModal(false);
    } else {
      toast.error('Código inválido');
    }
  } catch (error) {
    toast.error('Error al activar 2FA');
  }
};
```

### **3. Modal Component**

```typescript
{show2FAModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-bold mb-4">Configurar 2FA</h3>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Escanea este código QR con Google Authenticator o Authy:
        </p>
        
        <div className="flex justify-center">
          <QRCode value={qrCodeUrl} size={200} />
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-xs text-gray-600 mb-1">Código manual:</p>
          <code className="text-sm font-mono">{secret}</code>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Ingresa el código de 6 dígitos:
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="000000"
            maxLength={6}
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShow2FAModal(false)}
            className="flex-1 px-4 py-2 border rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmEnable2FA}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded"
          >
            Activar
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

---

## 🎨 **Características Adicionales Opcionales**

### **1. Códigos de Recuperación**
- Generar 10 códigos de un solo uso
- Mostrarlos al activar 2FA
- Permitir descargarlos o copiarlos
- Opción para regenerar

### **2. Historial de Uso**
- Registrar cada vez que se usa 2FA
- Mostrar dispositivos/IPs
- Alertas de uso sospechoso

### **3. Múltiples Métodos**
- SMS (requiere servicio externo)
- Email (como backup)
- Aplicación authenticator

---

## 🚀 **Estado de Implementación**

### **Completado:**
- ✅ UI básica en perfil
- ✅ Indicadores visuales
- ✅ Librería QR instalada

### **Siguiente Paso:**
Implementar los 3 endpoints backend y conectarlos con la UI.

¿Quieres que implemente la versión básica completa ahora?
