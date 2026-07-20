import { defineStore } from "pinia";
import { api } from "src/boot/axios";
import {
  canAccessAction,
  canAccessPage,
  canAccessTab,
  defaultRouteForTags
} from "src/utils/permissions";

const TOKEN_KEY = "lg_auth_token";
const USER_KEY = "lg_auth_user";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || null,
    user: JSON.parse(localStorage.getItem(USER_KEY) || "null")
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    tags: (state) => state.user?.tags || [],
    permissions: (state) => state.user?.permissions || [],
    churchId: (state) => state.user?.churchId ?? null,
    memberId: (state) => state.user?.memberId ?? null,
    fullName: (state) => state.user?.fullName || "",
    username: (state) => state.user?.username || ""
  },

  actions: {
    persist() {
      if (this.token) localStorage.setItem(TOKEN_KEY, this.token);
      else localStorage.removeItem(TOKEN_KEY);
      if (this.user) localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      else localStorage.removeItem(USER_KEY);
    },

    setSession(token, user) {
      this.token = token;
      this.user = user;
      this.persist();
    },

    clearSession() {
      this.token = null;
      this.user = null;
      this.persist();
    },

    async login(username, password) {
      const { data } = await api.post("/auth/login", { username, password });
      this.setSession(data.token, data.user);
      return data.user;
    },

    async fetchMe() {
      const { data } = await api.get("/auth/me");
      this.user = data;
      this.persist();
      return data;
    },

    logout() {
      this.clearSession();
    },

    canAccess(page) {
      return canAccessPage(this.tags, page, this.permissions);
    },

    canDo(actionKey) {
      return canAccessAction(this.tags, actionKey, this.permissions);
    },

    canTab(tabKey) {
      return canAccessTab(this.tags, tabKey, this.permissions);
    },

    defaultRoute() {
      return defaultRouteForTags(this.tags, this.permissions);
    }
  }
});
