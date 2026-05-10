console.log("JS connected");
console.log ("Frontend loaded");

const currentScriptUrl =
  document.currentScript?.src || new URL("/src/js/script.js", window.location.href).href;

import(new URL("./public/progress.js", currentScriptUrl).href)
  .then(({ initPublicProgress }) => {
    initPublicProgress();
  })
  .catch((error) => {
    console.error("Public progress failed to load", error);
  });
