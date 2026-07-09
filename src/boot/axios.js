import { boot } from "quasar/wrappers";
import axios from "axios";
import { useAuthStore } from "src/stores/auth";

const api = axios.create({
  baseURL: "http://localhost:3000/api"
});

export default boot(({ app, router }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  api.interceptors.request.use((config) => {
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
