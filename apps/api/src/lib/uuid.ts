/** Loose UUID (any version) check for route params. */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(param: string): boolean {
  return UUID.test(param);
}
