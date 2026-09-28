export function errorName(error: unknown) {
  return typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : '';
}

export function isAlreadyExists(error: unknown) {
  return [
    'ResourceAlreadyExistsException',
    'AlreadyExistsException',
    'ConflictException',
    'EntityAlreadyExists',
    'GroupExistsException',
  ].includes(errorName(error));
}

export function isNotFound(error: unknown) {
  if (typeof error !== 'object' || error === null) return false;
  const metadata = '$metadata' in error ? error.$metadata : undefined;
  const status =
    typeof metadata === 'object' && metadata !== null && 'httpStatusCode' in metadata
      ? metadata.httpStatusCode
      : undefined;
  return (
    status === 404 ||
    ['NotFound', 'ResourceNotFoundException', 'TemplateDoesNotExist'].includes(errorName(error))
  );
}

export async function createIfMissing(create: () => Promise<unknown>, label: string) {
  try {
    await create();
    console.log(`  -> Created ${label}.`);
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
    console.log(`  -> ${label} already exists.`);
  }
}
