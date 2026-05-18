let lastError: unknown | null = null;
export function consumeLastCapturedError() {
  const err = lastError;
  lastError = null;
  return err;
}
export function captureError(error: unknown) {
  lastError = error;
  console.error(error);
}
