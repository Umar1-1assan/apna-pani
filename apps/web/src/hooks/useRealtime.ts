import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

export function useRealtime(onReady?: () => void) {
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token }
    });

    socket.on("ready", () => {
      onReady?.();
    });

    return () => {
      socket.disconnect();
    };
  }, [onReady, token]);
}
