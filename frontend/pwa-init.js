(function () {
  let deferredPrompt = null;

  function ensureInstallButton() {
    const existing = document.getElementById("install-app-btn");
    if (existing) {
      return existing;
    }

    const button = document.createElement("button");
    button.id = "install-app-btn";
    button.type = "button";
    button.textContent = "Install App";
    button.hidden = true;
    button.style.position = "fixed";
    button.style.right = "16px";
    button.style.bottom = "16px";
    button.style.zIndex = "9999";
    button.style.padding = "12px 16px";
    button.style.border = "0";
    button.style.borderRadius = "999px";
    button.style.background = "#0e3a5f";
    button.style.color = "#fff";
    button.style.fontWeight = "700";
    button.style.boxShadow = "0 10px 24px rgba(14, 58, 95, 0.28)";
    button.style.cursor = "pointer";

    button.addEventListener("click", async function () {
      if (!deferredPrompt) {
        return;
      }

      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      button.hidden = true;
    });

    document.body.appendChild(button);
    return button;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("../sw.js").catch(function () {});
    });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    ensureInstallButton().hidden = false;
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    const button = document.getElementById("install-app-btn");
    if (button) {
      button.hidden = true;
    }
  });

  registerServiceWorker();
})();
