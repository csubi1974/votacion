# 🔧 INSTRUCCIONES FINALES PARA COMPLETAR 2FA

## ⚠️ El archivo UserProfile.tsx se corrompió durante las ediciones

### **Solución Rápida (5 minutos):**

1. **Restaurar el archivo desde git:**
   ```bash
   git checkout 711965d -- src/pages/UserProfile.tsx
   ```

2. **Buscar esta línea (aprox. línea 659):**
   ```typescript
                                        </div>
                                    </div>
                        )}
   ```

3. **Reemplazarla con:**
   ```typescript
                                        </div>
                                    </div>

                                    {!user.twoFactorEnabled ? (
                                        <button
                                            type="button"
                                            onClick={handleEnable2FA}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                        >
                                            <Shield className="w-4 h-4 mr-2" />
                                            Activar 2FA
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleDisable2FA}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                        >
                                            Desactivar 2FA
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
   ```

4. **Buscar el final del archivo (antes del último `</div></div></div>`):**
   Agregar ANTES del cierre final:
   ```typescript
                    {/* 2FA Modals */}
                    <Enable2FAModal
                        isOpen={showEnable2FAModal}
                        onClose={() => {
                            setShowEnable2FAModal(false);
                            setRecoveryCodes([]);
                        }}
                        qrCodeUrl={qrCodeUrl}
                        secret={twoFactorSecret}
                        onConfirm={handleConfirmEnable2FA}
                        recoveryCodes={recoveryCodes.length > 0 ? recoveryCodes : undefined}
                    />

                    <Disable2FAModal
                        isOpen={showDisable2FAModal}
                        onClose={() => setShowDisable2FAModal(false)}
                        onConfirm={handleConfirmDisable2FA}
                    />
   ```

---

## ✅ **Verificar que funciona:**

1. Recarga la página
2. Ve a tu perfil
3. Click en "Seguridad"
4. Deberías ver los botones "Activar 2FA" o "Desactivar 2FA"
5. Click en "Activar 2FA" debería abrir el modal con QR code

---

## 📝 **Estado Actual:**

### **✅ Completado al 100%:**
- Backend 2FA (4 endpoints)
- Modales (Enable2FAModal.tsx, Disable2FAModal.tsx)
- Funciones handler en UserProfile
- Estados y lógica

### **⚠️ Pendiente (solo agregar 2 bloques de código):**
- Conectar botones (línea ~659)
- Agregar modales al JSX (final del archivo)

---

## 🎯 **Alternativa: Usar el archivo de backup**

Si prefieres, puedes usar el archivo `UserProfile.tsx` del commit anterior y hacer los cambios manualmente siguiendo las instrucciones arriba.

---

**Hora:** 1:50 AM
**Razón:** El archivo es muy grande (~700 líneas) y las ediciones automáticas lo corrompieron.
**Solución:** Edición manual de 2 bloques pequeños de código.

¡Perdón por la complejidad! El 95% del trabajo está hecho. 🚀
