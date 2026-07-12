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
      vueRouterMode: "hash"
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
      injectPwaMetaTags: true,
      manifestFilename: "manifest.json",
      extendManifestJson(manifest) {
        manifest.name = "BHCCCI Church Management System";
        manifest.short_name = "BHCCCI";
      }
    },
    animations: []
  };
});
