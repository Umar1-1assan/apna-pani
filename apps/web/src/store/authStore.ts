import { create } from "zustand";

type AuthUser = {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  tenantId?: string;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  login: (payload: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  logout: () => void;
};

function readStorage() {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, user: null };
  }

  try {
    const raw = window.localStorage.getItem("aquaflow-auth");
    return raw ? (JSON.parse(raw) as Pick<AuthState, "accessToken" | "refreshToken" | "user">) : { accessToken: null, refreshToken: null, user: null };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

function persist(state: Pick<AuthState, "accessToken" | "refreshToken" | "user">) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("aquaflow-auth", JSON.stringify(state));
}

const initial = readStorage();

export const useAuthStore = create<AuthState>((set) => ({
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
  logout: () => {
    persist({ accessToken: null, refreshToken: null, user: null });
    set({ accessToken: null, refreshToken: null, user: null });
  }
}));
