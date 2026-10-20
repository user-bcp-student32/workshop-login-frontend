export function formatLoginError(username: string, backendMessage: string): string {
  return `No se pudo autenticar a ${username}.\n${backendMessage}`;
}