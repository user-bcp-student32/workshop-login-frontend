# Plan de correccion

## Item: H-03 — Dependencias con versiones señaladas en el reto

**Hallazgo:** H-03 de `HALLAZGOS.md`, severidad media, estado `Pendiente`. `package.json` y `package-lock.json` confirman `axios 0.31.0` y `lodash 4.17.21`; no se asume un CVE concreto sin evidencia de auditoria.

**Cambio propuesto:** Primero ejecutar y conservar el resultado de `npm audit --audit-level=moderate` para identificar advisories, versiones afectadas y versiones corregidas. Actualizar Axios a una version compatible que corrija los advisories confirmados, sin cambiar su uso ni los contratos de `POST /auth/login` y `GET /api/tasks?owner=...`. El codigo fuente solo usa `lodash/merge` para combinar el objeto plano de preferencias; caracterizar ese comportamiento y sustituirlo por una combinacion nativa tipada de valores por defecto y preferencias guardadas. Retirar `lodash` y `@types/lodash` de `package.json` solo si esa sigue siendo su unica referencia, y regenerar el lockfile. Si la auditoria no atribuye un advisory a una dependencia, no afirmar que existe uno ni actualizarla sin justificacion; registrar la evidencia y dejar ese subitem pendiente de decision.

No cambiar URLs, metodo, cuerpo, timeout de login, query, bearer, respuestas ni manejo de errores documentados en `docs/ENDPOINTS.md`. No agregar dependencias.

**Archivos a tocar para H-03:**

- `package.json`: version corregida de Axios y, si procede, retirar Lodash y sus tipos.
- `package-lock.json`: actualizar versiones/transitivos con npm, sin editar el lock manualmente.
- `src/app/login/login.component.ts`: reemplazar el merge de Lodash por merge nativo tipado de preferencias.
- `src/app/login/login.component.spec.ts`: pruebas de preferencias guardadas y valores por defecto.
- `src/app/auth/auth.service.spec.ts` y `src/app/tasks/tasks.service.spec.ts`: mantener/assertar los contratos Axios durante el cambio de version.
- `HALLAZGOS.md`: actualizar H-03 solo con el resultado de auditoria y la remediacion realmente aplicada.

**Pruebas de caracterizacion a escribir antes de tocar esos archivos (H-03):**

- En `login.component.spec.ts`, comprobar que preferencias parciales guardadas reemplazan solo sus campos y que los campos no guardados conservan los defaults actuales (`theme`, `showTips`, `compact`). Caracterizar tambien la ausencia de preferencias y JSON invalido si se va a cambiar ese manejo.
- Antes de actualizar Axios, conservar aserciones de `auth.service.spec.ts` para URL, body y timeout de login, y de `tasks.service.spec.ts` para URL, `owner` y header bearer.
- Ejecutar auditoria baseline y guardar su salida antes del cambio; despues, repetirla y comparar advisories, además de `npm test`, `npm test -- --coverage` y `npm run build`. La auditoria debe respaldar cada actualizacion o retirada de dependencia.

## Item: H-04 — Componentes concentran HTTP, almacenamiento de sesion y navegacion

**Hallazgo:** H-04 de `HALLAZGOS.md`, severidad media, estado `Pendiente` con resolucion parcial.

**Problema pendiente:** Las llamadas HTTP y la sesion ya estan delegadas a `AuthService` y `TasksService`, pero `DashboardComponent.ngOnInit()` aun decide si una sesion falta y realiza la redireccion a `/login`. La proteccion de acceso pertenece al enrutamiento; mantenerla en el componente acopla la carga de la vista con la autorizacion de ruta.

**Cambio propuesto:** Agregar un `AuthGuard` que consulte `AuthService.session` y proteger `/dashboard` con `canActivate`. Con sesion, permite activar la ruta; sin sesion, devuelve una redireccion a `/login`. Eliminar de `DashboardComponent` la responsabilidad de navegar cuando no hay sesion; mantener el consumo de `TasksService`, el estado de carga/error y la accion explicita de logout. No mover ni duplicar llamadas HTTP o almacenamiento, que ya pertenecen a servicios. Login, consulta de tareas, header bearer, query `owner` y logout conservaran el contrato descrito en `docs/ENDPOINTS.md`.

**Archivos a tocar para H-04:**

- `src/app/auth/auth.guard.ts` (nuevo): regla de activacion basada en la sesion del `AuthService`.
- `src/app/auth/auth.guard.spec.ts` (nuevo): casos de sesion presente y ausente.
- `src/app/app.routes.ts`: asociar el guard a la ruta `/dashboard`.
- `src/app/dashboard/dashboard.component.ts`: retirar la redireccion de autorizacion que quedara a cargo del guard.
- `src/app/dashboard/dashboard.component.spec.ts`: conservar y ajustar la caracterizacion de carga, ausencia de sesion y logout al nuevo limite de responsabilidad.

**Pruebas de caracterizacion a escribir antes de modificar rutas o componentes (H-04):**

- Crear `auth.guard.spec.ts` antes del guard. Caracterizar el contrato propuesto: con sesion, permite activar dashboard; sin sesion, devuelve un `UrlTree` para `/login`.
- Crear `app.routes.spec.ts` antes de asociar el guard y comprobar que `/dashboard` queda protegido, mientras `/login`, la ruta vacia y la ruta comodin conservan su destino actual.
- Ampliar `dashboard.component.spec.ts` antes de retirar la comprobacion local para conservar el camino con sesion (consulta de tareas), el logout explicito y el estado de error; la redireccion por ausencia de sesion pasa a ser responsabilidad probada del guard.

## Item: H-05 — Tipado `any`, validacion anidada y claves de sesion repartidas

**Hallazgo:** H-05 de `HALLAZGOS.md`, severidad baja, estado `Pendiente` con resolucion parcial.

**Problema pendiente:** Login y dashboard ya usan tipos explicitos, login tiene retornos anticipados y las claves de sesion estan centralizadas. El remanente comprobado es `formatTaskLabel(task: any)`: acepta cualquier forma de dato y permite errores de acceso a `priority` u `owner` sin deteccion estatica.

**Cambio propuesto:** Definir en `legacy-format.ts` un tipo de entrada minimo con `priority` y `owner` opcionales, y permitir explicitamente `null`/`undefined` porque la funcion actual devuelve `SIN-DATOS` para esos valores. Mantener intacta la salida para prioridad/owner presentes o ausentes. No modificar la estructura de componentes, los servicios, los endpoints ni las demas categorias de H-05 que ya quedaron resueltas parcialmente.

**Archivos a tocar para H-05:**

- `src/app/utils/legacy-format.ts`: sustituir `any` por el tipo minimo de entrada compatible con `Task`.
- `src/app/utils/legacy-format.spec.ts`: caracterizar y verificar los casos validos, propiedades ausentes y entrada nula.

**Pruebas de caracterizacion a escribir antes de modificar la utilidad (H-05):**

- Verificar prioridad y owner presentes: `high` y `student` producen `HIGH · STUDENT`.
- Verificar `{}` y campos ausentes o vacios: se conservan los fallbacks actuales `NORMAL` y `SIN-ASIGNAR`.
- Verificar `null` y `undefined`: se conserva `SIN-DATOS`.
- Asegurar que la firma tipada acepta un objeto `Task` del servicio de tareas sin conversiones a `any`.