import { route } from "quasar/wrappers";
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from "vue-router";
import routes from "./routes";
import { useAuthStore } from "src/stores/auth";
import { canAccessPage } from "src/utils/permissions";

export default route(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  });

  Router.beforeEach((to, _from, next) => {
    const auth = useAuthStore(store);
    const isPublic = to.meta?.public === true;

    if (isPublic) {
      if (to.path === "/login" && auth.isAuthenticated) {
        return next(auth.defaultRoute());
      }
      return next();
    }

    if (!auth.isAuthenticated) {
      return next({ path: "/login", query: { redirect: to.fullPath } });
    }

    const page = to.meta?.page;
    if (page && !canAccessPage(auth.tags, page)) {
      return next(auth.defaultRoute());
    }

    return next();
  });

  return Router;
});
