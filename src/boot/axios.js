import { boot } from "quasar/wrappers";
import axios from "axios";
import { useAuthStore } from "src/stores/auth";
import { currentPublicPath, isPublicApiPath, isPublicRouteRecord } from "src/utils/publicRoutes";

const api = axios.create({
  baseURL: process.env.API_URL
});

function isPublicRequest(router, requestUrl) {
  return (
    isPublicApiPath(requestUrl) ||
    isPublicRouteRecord(router?.currentRoute?.value) ||
    isPublicRouteRecord({ path: currentPublicPath() })
  );
}

export default boot(({ app, router }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  api.interceptors.request.use((config) => {
    if (isPublicRequest(router, config.url)) {
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
      if (error.response?.status === 401 && !isPublicRequest(router, error.config?.url)) {
        const auth = useAuthStore();
        auth.clearSession();
        if (router.currentRoute.value.path !== "/login") {
          router.push("/login");
        }
      }
      return Promise.reject(error);
    }
  );
});

export { axios, api };
