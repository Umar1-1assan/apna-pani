import { create } from "zustand";

function readStorage() {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, user: null };
  }
  try {
    const raw = window.localStorage.getItem("aquaflow-auth");
    return raw ? JSON.parse(raw) : { accessToken: null, refreshToken: null, user: null };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

function persist(state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("aquaflow-auth", JSON.stringify(state));
}

const initial = readStorage();

export const useAuthStore = create((set) => ({
  accessToken: initial.accessToken,
  refreshToken: initial.refreshToken,
  user: initial.user,

  login: (payload) => {
    const nextState = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: payload.user
    };
    persist(nextState);
    set(nextState);
  },

  setTokens: (accessToken, refreshToken) => {
    set((state) => {
      const nextState = {
        accessToken,
        refreshToken: refreshToken ?? state.refreshToken,
        user: state.user
      };
      persist(nextState);
      return nextState;
    });
  },

  logout: () => {
    persist({ accessToken: null, refreshToken: null, user: null });
    set({ accessToken: null, refreshToken: null, user: null });
  }
}));
