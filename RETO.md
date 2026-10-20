# Reto — Frontend Angular

El flujo funcional que hay que preservar y los endpoints que consume esta app
están en `docs/ENDPOINTS.md`. Este archivo es solo la lista de lo que hay que
encontrar.

## Deuda técnica intencional

| Área | Caso sembrado | Resultado esperado del estudiante |
|---|---|---|
| Dependencias | `lodash 4.17.21` y `axios 0.31.0` | Analizar CVEs, eliminar o actualizar con evidencia. |
| Seguridad | Token en `localStorage` (atendido; sesión solo en memoria) | Mantener el token fuera del almacenamiento persistente y verificar login tras recarga. |
| Seguridad | Mensaje dinámico renderizado como texto (atendido) | Mantener contenido no confiable sin interpretar como HTML. |
| Arquitectura | Componentes conocen URLs, HTTP, sesión y navegación | Separar responsabilidades. |
| Calidad | Uso extensivo de `any`, condicionales anidados y duplicación | Introducir tipos, servicios y funciones pequeñas. |
| Testing | Cobertura limitada a una utilidad | Definir pruebas de flujo y reglas de negocio. |

No se incluyen payloads de explotación. El propósito es identificar, priorizar y
remediar hallazgos.
