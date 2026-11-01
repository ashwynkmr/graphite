/** Asks the browser not to clear this app's data under storage pressure (TRD "Storage persistence"). */
export async function requestPersistence(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    // Not offered in this browser; export is still the safeguard.
  }
}

/** True or false once known; null where the browser doesn't say. */
export async function isPersisted(): Promise<boolean | null> {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null;
  } catch {
    return null;
  }
}
