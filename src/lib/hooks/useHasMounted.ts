import { useSyncExternalStore } from "react";

// The store never changes; the server/client snapshot pair is what carries the signal.
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Returns `false` on the server and during hydration, `true` once mounted on the client.
 *
 * Used to defer `createPortal` until `document.body` exists. Preferred over the
 * `useState` + `useEffect` mount flag, which schedules an extra render pass.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
