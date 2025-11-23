# Solución al Error 500 del Dashboard

## Problema:
El endpoint `/api/admin/dashboard` está fallando con error 500 porque la query de `Vote.count` no especifica el alias correcto para la asociación con `Election`.

## Archivo a Modificar:
`api/routes/admin.ts`

## Cambio Necesario:

### Líneas 63-69 (ANTES):
```typescript
      Vote.count({
        include: [{
          model: Election,
          where: whereClause,
          required: true
        }]
      }),
```

### Líneas 63-70 (DESPUÉS):
```typescript
      Vote.count({
        include: [{
          model: Election,
          as: 'election',  // ← AGREGAR ESTA LÍNEA
          where: whereClause,
          required: true
        }]
      }),
```

## Explicación:
El modelo `Vote` tiene una asociación `belongsTo` con `Election` usando el alias `'election'` (definido en `api/models/index.ts` línea 60-62). Sequelize requiere que uses el mismo alias cuando haces queries con `include`.

## Cómo Aplicar el Cambio:

1. Abre el archivo `api/routes/admin.ts`
2. Busca la línea 65 que dice: `model: Election,`
3. Justo después de esa línea, agrega: `as: 'election',`
4. Guarda el archivo
5. El servidor se reiniciará automáticamente con `nodemon`
6. Recarga la página del dashboard

## Verificación:
Después del cambio, el dashboard debería cargar correctamente mostrando:
- Total de usuarios
- Total de elecciones
- Elecciones activas
- Total de votos
- Elecciones recientes
- Usuarios recientes

---

**Nota:** Este es un cambio de una sola línea. Solo necesitas agregar `as: 'election',` en la línea 66.
