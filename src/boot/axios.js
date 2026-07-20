import { boot } from "quasar/wrappers";
import axios from "axios";
import { useAuthStore } from "src/stores/auth";

const api = axios.create({
  baseURL: process.env.API_URL
});

function isPublicApiUrl(url = "") {
  const path = String(url).split("?")[0];
  return (
    /\/events\/[^/]+\/signup\/?$/.test(path) ||
    /\/events\/[^/]+\/register\/[^/]+(\/pay)?\/?$/.test(path) ||
    /\/auth\/login\/?$/.test(path) ||
    /\/health\/?$/.test(path)
  );
}

function isPublicRoute(router) {
  return router.currentRoute.value.matched.some((record) => record.meta?.public === true);
}

export default boot(({ app, router }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  api.interceptors.request.use((config) => {
    // Keep public registration flows credential-free even if a stale token exists
    if (isPublicApiUrl(config.url) || isPublicRoute(router)) {
      if (config.headers) {
        delete config.headers.Authorization;
        delete config.headers.authorization;
      }
      return config;
    }
    const auth = useAuthStore();
    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const publicPage = isPublicRoute(router);
        const publicApi = isPublicApiUrl(error.config?.url);
        if (!publicPage && !publicApi) {
          const auth = useAuthStore();
          auth.clearSession();
          if (router.currentRoute.value.path !== "/login") {
            router.push("/login");
          }
        }
      }
      return Promise.reject(error);
    }
  );
});

export { axios, api };
