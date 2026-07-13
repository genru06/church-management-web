import { configure } from "quasar/wrappers";

export default configure(function () {
  return {
    supportTS: false,
    boot: ["pinia", "axios"],
    css: ["app.scss"],
    extras: ["material-icons"],
    build: {
      target: {
        browser: ["es2022", "firefox115", "chrome115", "safari14"],
        node: "node20"
      },
      vueRouterMode: "history"
    },
    devServer: {
      open: false
    },
    framework: {
      config: {},
      plugins: ["Dialog", "Notify"]
    },
    pwa: {
      workboxMode: "InjectManifest",
      injectPwaMetaTags({ publicPath, pwaManifest }) {
        const themeColor = pwaManifest.theme_color || "#1565c0";
        const appTitle = pwaManifest.short_name || "BHCCCI";

        return (
          `<meta name="theme-color" content="${themeColor}">` +
          `<meta name="apple-mobile-web-app-capable" content="yes">` +
          `<meta name="apple-mobile-web-app-status-bar-style" content="default">` +
          `<meta name="apple-mobile-web-app-title" content="${appTitle}">` +
          `<link rel="apple-touch-icon" href="${publicPath}apple-touch-icon.png">` +
          `<link rel="apple-touch-icon" sizes="180x180" href="${publicPath}apple-touch-icon.png">` +
          `<link rel="apple-touch-icon" sizes="167x167" href="${publicPath}icons/apple-icon-167x167.png">` +
          `<link rel="apple-touch-icon" sizes="152x152" href="${publicPath}icons/apple-icon-152x152.png">` +
          `<link rel="apple-touch-icon" sizes="120x120" href="${publicPath}icons/apple-icon-120x120.png">` +
          `<meta name="msapplication-TileImage" content="${publicPath}icons/ms-icon-144x144.png">` +
          `<meta name="msapplication-TileColor" content="#ffffff">`
        );
      },
      manifestFilename: "manifest.json",
      extendManifestJson(manifest) {
        manifest.name = "BHCCCI Church Management System";
        manifest.short_name = "BHCCCI";
      }
    },
    animations: []
  };
});
