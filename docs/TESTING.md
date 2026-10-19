# Pruebas de login y tareas

Los casos siguen el contrato de `docs/ENDPOINTS.md`. Las respuestas Axios y errores de red se simulan en Vitest; no representan llamadas ejecutadas contra los backends.

| Flujo | Caso | Tipo | Resultado esperado |
|---|---|---|---|
| Login → tareas | Credenciales validas; login entrega token y usuario, TasksService devuelve una tarea | Camino feliz | Se conserva el contrato de login; tareas se consultan para `student` con `Authorization: Bearer test-token` y se devuelve la lista. |
| Login | Usuario vacio | Caso borde | No se llama AuthService; se muestra `Ingrese un usuario.`. |
| Login | Contraseña vacia | Caso borde | No se llama AuthService; se muestra `Ingrese una contraseña.`. |
| Login | Respuesta sin token | Caso borde | No se navega al dashboard; se muestra el mensaje generico de respuesta incompleta. |
| Login | Respuesta sin `data` | Error | AuthService rechaza la respuesta inesperada; LoginComponent muestra el mensaje generico de autenticacion. |
| Login | Backend no disponible | Error | Se muestra el mensaje generico de autenticacion, sin exponer el error de red, y se restablece `busy`. |
| Login | Timeout de 5000 ms | Error | Se muestra el mismo mensaje generico y se restablece `busy`. |
| Tareas | Token invalido, respuesta 401 con `detail` | Error | El dashboard muestra el detalle como texto; no limpia la sesion ni redirige automaticamente. |
| Tareas | Timeout/rechazo externo | Error | Se muestra el `message` de la excepcion y se desactiva `loading`. `TasksService` no fija un timeout propio. |
| Tareas | API no disponible o error sin detalle | Error | Se muestra el mensaje de excepcion o, si no existe, `No se pudo cargar el dashboard`; `loading` pasa a `false`. |
| Tareas | Sin sesion en memoria | Caso borde | Se navega a `/login` y no se consulta la API. |

## Codigo de los tests

Los siguientes extractos corresponden a los tests implementados en los specs indicados.

### Camino feliz — `src/app/tasks/tasks.service.spec.ts`

```ts
it('logs in and returns tasks using the authenticated owner and bearer token', async () => {
  const expectedTasks = [
    { title: 'Task one', status: 'TODO', priority: 'HIGH', owner: 'student' }
  ];
  vi.mocked(axios.post).mockResolvedValue({
    data: { token: 'test-token', user: { username: 'student' } }
  } as never);
  vi.mocked(axios.get).mockResolvedValue({ data: expectedTasks } as never);
  await authService.login('student', 'Workshop123!');

  const tasks = await service.getTasks('student');

  expect(axios.get).toHaveBeenCalledWith(
    'http://localhost:8000/api/tasks?owner=student',
    { headers: { Authorization: 'Bearer test-token' } }
  );
  expect(tasks).toEqual(expectedTasks);
});
```

### Bordes — `src/app/login/login.component.spec.ts`

```ts
it('reports missing credentials as plain text without calling the auth service', async () => {
  const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);

  await component.login();
  expect(component.message).toBe('Ingrese un usuario.');
  component.username = 'student';
  await component.login();
  expect(component.message).toBe('Ingrese una contraseña.');
  expect(authService.login).not.toHaveBeenCalled();
});

it('shows a safe message when the response has no token', async () => {
  authService.login.mockResolvedValue(null);
  const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);
  component.username = 'student';
  component.password = 'Workshop123!';

  await component.login();

  expect(component.message).toBe('No se pudo iniciar sesión. Intenta de nuevo.');
  expect(router.navigate).not.toHaveBeenCalled();
  expect(component.busy).toBe(false);
});
```

La respuesta de login sin `data` tambien se prueba directamente en `src/app/auth/auth.service.spec.ts`:

```ts
it('rejects an unexpected login response without data', async () => {
  vi.mocked(axios.post).mockResolvedValue(undefined as never);

  await expect(service.login('student', 'Workshop123!')).rejects.toThrow();
});
```

### Backend no disponible y timeout — `src/app/login/login.component.spec.ts`

```ts
it('shows the generic authentication message when the backend is unavailable', async () => {
  authService.login.mockRejectedValue(new Error('Network Error'));
  const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);
  component.username = 'student';
  component.password = 'Workshop123!';

  await component.login();

  expect(component.message).toBe('No se pudo autenticar. Verifica tus credenciales e intenta de nuevo.');
  expect(component.busy).toBe(false);
});

it('shows the generic authentication message when the login request times out', async () => {
  const timeoutError = Object.assign(new Error('timeout of 5000ms exceeded'), { code: 'ECONNABORTED' });
  authService.login.mockRejectedValue(timeoutError);
  const component = new LoginComponent(router as unknown as Router, authService as unknown as AuthService);
  component.username = 'student';
  component.password = 'Workshop123!';

  await component.login();

  expect(component.message).toBe('No se pudo autenticar. Verifica tus credenciales e intenta de nuevo.');
  expect(component.busy).toBe(false);
});
```

### Token invalido y timeout externo — `src/app/dashboard/dashboard.component.spec.ts`

```ts
it('shows an invalid-token response detail without silently ending the session', async () => {
  tasksService.getTasks.mockRejectedValue({ response: { status: 401, data: { detail: 'Invalid token' } } });

  await component.ngOnInit();

  expect(component.error).toBe('Invalid token');
  expect(component.loading).toBe(false);
  expect(authService.logout).not.toHaveBeenCalled();
  expect(router.navigate).not.toHaveBeenCalled();
});

it('shows the message when task loading rejects due to an external timeout', async () => {
  tasksService.getTasks.mockRejectedValue(new Error('timeout of external request'));

  await component.ngOnInit();

  expect(component.error).toBe('timeout of external request');
  expect(component.loading).toBe(false);
});
```

## Ejecuciones

Directorio de trabajo para ambos comandos: `workshop-login-frontend/`.

| Comando | Codigo de salida | Resultado ejecutado |
|---|---:|---|
| `npm test -- src/app/auth/auth.service.spec.ts src/app/dashboard/dashboard.component.spec.ts` | 0 | 2 archivos aprobados, 15 tests aprobados; duracion 642 ms. |
| `npm test -- --coverage` | 0 | 5 archivos aprobados, 25 tests aprobados; duracion 1.25 s. Cobertura global: 86.26% statements/lines, 85.18% branches y 88.88% functions. |

La ejecucion con cobertura supera el minimo de 85% de `REGLAS.md`. `AuthService`, `TasksService` y `DashboardComponent` reportan 100% de lineas; `LoginComponent`, 96.15%.

## Fallos

No hubo tests fallidos en las dos ejecuciones registradas.

## Pendientes

- Los tests simulan Axios; no se comprobaron credenciales, codigos HTTP ni esquemas contra los servicios reales.
- `TasksService` no define timeout. El test de timeout de tareas simula un rechazo externo, tal como describe `docs/ENDPOINTS.md`.
- No hay contrato backend confirmado para el codigo de exito ni validacion en runtime de la forma completa de las respuestas.

## Pruebas propuestas

- Agregar pruebas de contrato contra backends locales disponibles para confirmar status HTTP, esquema de `user`, formato de errores y forma de la lista de tareas.
- Si la API de tareas adopta un timeout propio, probar ese limite y su mensaje de UI como contrato separado.

## Fuentes consultadas

- `docs/ENDPOINTS.md` — solicitudes, respuestas, errores y limites conocidos.
- `REGLAS.md` — meta minima de cobertura del 85%.
- `src/app/auth/auth.service.spec.ts`, `src/app/tasks/tasks.service.spec.ts`, `src/app/login/login.component.spec.ts` y `src/app/dashboard/dashboard.component.spec.ts` — implementacion y aserciones de pruebas.
- `package.json` — comandos de Vitest y cobertura.