import prisma from '../utils/prisma';

const KEY = 'MENU_VERSION';

/** Call after any change customers can see (dishes, settings). Every open site notices the new value and refreshes. */
export async function bumpMenuVersion(): Promise<void> {
  try {
    const value = String(Date.now());
    await prisma.setting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
  } catch {
    // A failed bump must never fail the admin's save
  }
}

export async function getMenuVersion(): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  return row?.value ?? '0';
}
