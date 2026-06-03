import { initializeAuth } from "./core/auth.js";
import { router } from "./core/router.js";

function initializeApp() {
  initializeAuth({
    onLogin: () => router.start(),
    onLogout: () => router.stop(),
    onRoleChange: () => router.refresh()
  });

  router.start();
}

initializeApp();
