import { useState, useEffect } from "react";
import { STORAGE_KEYS, BACKEND_CONNECTION_EVENT } from "@/constants";

function readIsConnected(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEYS.GAS_URL);
  } catch {
    return false;
  }
}

export function useBackendConnected(): boolean {
  const [isConnected, setIsConnected] = useState(readIsConnected);

  useEffect(() => {
    const update = () => setIsConnected(readIsConnected());
    window.addEventListener(BACKEND_CONNECTION_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(BACKEND_CONNECTION_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return isConnected;
}
