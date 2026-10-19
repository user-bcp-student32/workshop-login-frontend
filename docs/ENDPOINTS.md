# Endpoints externos

Este documento describe el comportamiento actual del frontend. Las URLs se obtienen de `src/environments/environment.ts`. Las formas TypeScript describen lo que espera el cliente, pero no son validaciones del JSON en tiempo de ejecucion.

## Login — `POST http://localhost:8080/auth/login`

### 1. Quien lo llama

`LoginComponent.login()` valida que usuario y contraseña no esten vacios y llama a `AuthService.login(username, password)`. `AuthService` realiza la solicitud con Axios.

### 2. Que envia

No se configuran encabezados de autenticacion ni parametros de query. El servicio entrega a Axios el objeto de cuerpo siguiente y un timeout de 5000 ms; no construye encabezados manualmente.

| Parte | Campo | Tipo/valor | Uso |
|---|---|---|---|
| Header | Ninguno configurado por la aplicacion | — | No requiere token previo. |
| Body | `username` | `string` | Valor ingresado en el formulario. |
| Body | `password` | `string` | Valor ingresado en el formulario. |
| Body | `client` | Constante `angular-workshop` | Identifica el cliente frontend. |
| Query | Ninguno | — | No se agregan parametros. |
| Configuracion | `timeout` | 5000 ms | Axios rechaza la solicitud si vence este limite. |

Ejemplo con las credenciales de laboratorio documentadas en `README.md`:

```http
POST http://localhost:8080/auth/login

{"username":"student","password":"Workshop123!","client":"angular-workshop"}
```

### 3. Que espera recibir en exito

El cliente no comprueba un codigo de estado concreto ni lee `response.status`; continua cuando la promesa de Axios se resuelve. **Pregunta abierta:** confirmar con el backend el codigo de exito contractual. La interfaz `LoginResponse` espera este cuerpo:

| Campo | Tipo esperado | Como lo usa el frontend |
|---|---|---|
| Estado HTTP | La aplicacion no comprueba un codigo concreto; Axios resuelve por defecto respuestas 2xx | El login continua cuando la promesa se resuelve. **Pregunta abierta:** confirmar el status contractual del backend. |
| `token` | `string` opcional en TypeScript; debe ser truthy para iniciar sesion | Se conserva en la sesion en memoria de `AuthService` y luego se envia como bearer al endpoint de tareas. |
| `user` | `AuthUser`: `username: string`, `displayName?: string` | `username` identifica al propietario de las tareas; `displayName` se muestra en el saludo si existe. |

Ejemplo compatible de respuesta (el status `200` solo ilustra un exito Axios; el status contractual no esta confirmado. El texto del token es ilustrativo):

```http
HTTP/1.1 200 OK

{
	"token": "<token emitido por el backend>",
	"user": {
		"username": "student"
	}
}
```

El cliente no valida en ejecucion que `user` exista ni que sus propiedades tengan esos tipos. **Pregunta abierta:** confirmar el esquema completo de `user` y las restricciones/vida util del token con el backend.

### 4. Errores y reaccion de la UI

| Caso | Comportamiento comprobable |
|---|---|
| Usuario o contraseña vacios | `LoginComponent` no llama al endpoint y muestra `Ingrese un usuario.` o `Ingrese una contraseña.`. |
| Respuesta resuelta sin `token` truthy | `AuthService.login()` devuelve `null`; el formulario muestra `No se pudo iniciar sesión. Intenta de nuevo.` y no navega al dashboard. |
| HTTP no exitoso, credenciales rechazadas, red o timeout de 5000 ms | Axios rechaza; el formulario muestra `No se pudo autenticar. Verifica tus credenciales e intenta de nuevo.`. No expone el cuerpo ni el mensaje interno del error. |
| Respuesta inesperada sin `data` | El acceso a `response.data.token` produce un error que llega al mismo mensaje generico de autenticacion. |
| Token presente pero `user` ausente o mal formado | No hay validacion del usuario en login; se puede navegar al dashboard. La carga de tareas puede fallar al acceder a `user.username` y el dashboard muestra el mensaje de error que resulte. |

En todos los casos que entran al bloque de solicitud, `busy` vuelve a `false` en `finally`.

### 5. Notas de seguridad

- El token y el usuario viven solo en memoria en `AuthService`; no se guardan en `localStorage`. Al inicializarse, el servicio elimina las claves de sesion heredadas `workshop_token` y `workshop_user`. Recargar la aplicacion requiere autenticarse otra vez.
- La preferencia no sensible `workshop_preferences` sigue en `localStorage` y no se envia a este endpoint.
- El template presenta el mensaje mediante interpolacion Angular (`{{ message }}`), no mediante `[innerHTML]`.
- La URL actual usa HTTP local y el body contiene la contraseña. Usar unicamente las credenciales de laboratorio; el frontend no configura TLS.

## Tareas — `GET http://localhost:8000/api/tasks?owner=<username>`

### 1. Quien lo llama

`DashboardComponent.ngOnInit()` comprueba que `AuthService` tenga una sesion en memoria y llama `TasksService.getTasks(session.user.username)`. `TasksService` realiza la solicitud con Axios. Sin sesion, el dashboard navega a `/login` y no llama al endpoint.

### 2. Que envia

No envia body. `owner` se concatena directamente en la URL; el codigo no aplica codificacion URL.

| Parte | Campo | Tipo/valor | Uso |
|---|---|---|---|
| Header | `Authorization` | `Bearer <token>` | Token tomado de la sesion en memoria de `AuthService`. |
| Query | `owner` | `string` | `session.user.username`. |
| Body | Ninguno | — | La llamada es GET. |
| Configuracion | Timeout | No especificado | El codigo no fija un timeout para esta solicitud. |

Ejemplo con el usuario y token de las pruebas del servicio:

```http
GET http://localhost:8000/api/tasks?owner=student
Authorization: Bearer test-token
```

### 3. Que espera recibir en exito

El cliente no inspecciona `response.status`; procesa `response.data` cuando Axios resuelve. **Pregunta abierta:** confirmar con la API el codigo de exito contractual. El tipo `Task[]` describe la lista y cada elemento:

| Campo | Tipo en el cliente | Uso |
|---|---|---|
| Estado HTTP | La aplicacion no comprueba un codigo concreto; Axios resuelve por defecto respuestas 2xx | Dashboard procesa `response.data` cuando la promesa se resuelve. **Pregunta abierta:** confirmar el status contractual de la API. |
| `title` | `string` | Texto del titulo mostrado en la tarjeta. |
| `description` | `string` opcional | Texto descriptivo mostrado en la tarjeta. |
| `status` | `string` | Excluye `ARCHIVED`, determina la etiqueta de estado y la clase visual. |
| `priority` | `number \| string` opcional | Orden descendente y etiqueta calculada. |
| `owner` | `string` opcional | Etiqueta calculada; si falta o es falsy, se usa `SIN-ASIGNAR`. |
| `label` | `string` opcional en el tipo compartido | La UI la calcula localmente; no necesita recibirla del servidor. |

Ejemplo compatible con la prueba del servicio (respuesta `200` ilustrativa, no confirmacion del status del backend; lista de prueba, no fixture real):

```http
HTTP/1.1 200 OK

[
	{
		"title": "Task one",
		"status": "TODO",
		"priority": "HIGH",
		"owner": "student"
	}
]
```

Dashboard omite tareas `ARCHIVED`, calcula `label` con prioridad y owner en mayusculas, y ordena la lista visible por prioridad descendente. Una lista vacia muestra `No hay tareas para mostrar todavía.`. **Pregunta abierta:** el cliente no valida en ejecucion que la respuesta sea un array ni valida los campos recibidos.

### 4. Errores y reaccion de la UI

| Caso | Comportamiento comprobable |
|---|---|
| No hay sesion en memoria | `DashboardComponent` navega a `/login` y no solicita tareas. `TasksService` tambien rechaza una llamada directa sin sesion. |
| Token invalido/expirado o respuesta HTTP no exitosa | Axios rechaza. Si `response.data.detail` es string, dashboard lo muestra literalmente; si no, muestra `error.message` cuando es string. No limpia la sesion ni redirige automaticamente. |
| Red o solicitud rechazada por timeout externo | No se configura timeout en `TasksService`. Si Axios rechaza por red o por un limite impuesto fuera de este codigo, se aplica el mismo manejo anterior. |
| Respuesta resuelta con forma inesperada, por ejemplo `data` que no sea array | El procesamiento con `.filter()` falla; el catch muestra el `message` de esa excepcion y desactiva `loading`. No hay validacion previa del esquema. |
| Error sin `response.data.detail` string ni `message` string | Dashboard muestra `No se pudo cargar el dashboard`. En todos los errores, desactiva `loading` y conserva la vista del dashboard con el mensaje. |

### 5. Notas de seguridad

- El bearer se obtiene de la sesion volatil de `AuthService`; no se lee de almacenamiento persistente. El logout limpia esa sesion local y navega a `/login`; no se hace una llamada HTTP de logout.
- `owner` se concatena sin codificacion URL. **Pregunta abierta:** confirmar si el backend limita el formato de username o si el cliente debe codificarlo.
- El mensaje `detail` del backend se presenta como texto interpolado, no como HTML. Aunque Angular no lo interpreta como marcado, el contenido no se redacta y podria exponer detalles internos.
- La UI muestra `title` y `description` con interpolacion Angular; no usa `[innerHTML]` para renderizar tareas.

## Documentos consultados

- `README.md` — credenciales de laboratorio, servicios y ejecucion local.
- `REGLAS.md` — endpoints y reglas del laboratorio.
- `docs/GOOD_PRACTICES.md` — servicios, sesion centralizada, tipado y manejo de errores.
- `PLAN.md` — decisiones aprobadas de refactorizacion y comportamiento de sesion.
- `HALLAZGOS.md` — estado de los hallazgos y riesgos registrados.
- `docs/ENDPOINTS.md` — version anterior contrastada y actualizada en este cambio.
- `package.json` — version de Axios y herramientas disponibles.