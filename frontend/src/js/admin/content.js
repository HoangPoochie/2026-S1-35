import { apiFetch } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";

let themes = [];
let modules = [];
let uploads = { images: [], videos: [] };

const contentMessage = document.getElementById("content-message");
const themeForm = document.getElementById("theme-form");
const moduleForm = document.getElementById("module-form");

function setMessage(message, isError = false) {
  if (!contentMessage) return;
  contentMessage.textContent = message;
  contentMessage.classList.toggle("error", isError);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function getNumberValue(id) {
  const value = Number(document.getElementById(id)?.value || 0);
  return Number.isFinite(value) ? value : 0;
}

function getChecked(id) {
  return Boolean(document.getElementById(id)?.checked);
}

function isPublished(value) {
  return value === true || value === 1 || value === "1";
}

function setValue(id, value) {
  const input = document.getElementById(id);
  if (input) input.value = value ?? "";
}

function setChecked(id, value) {
  const input = document.getElementById(id);
  if (input) input.checked = Boolean(value);
}

function clearFileInput(id) {
  const input = document.getElementById(id);
  if (input) input.value = "";
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function themePayload() {
  return {
    title: getValue("theme-title"),
    description: getValue("theme-description"),
    sortOrder: getNumberValue("theme-sort-order"),
    published: getChecked("theme-published")
  };
}

function modulePayload() {
  return {
    themeId: Number(getValue("module-theme-id")),
    title: getValue("module-title"),
    summary: getValue("module-summary"),
    body: getValue("module-body"),
    imageUrl: getValue("module-image-url"),
    imageAltText: getValue("module-image-alt-text"),
    videoUrl: getValue("module-video-url"),
    challengeText: getValue("module-challenge-text"),
    sortOrder: getNumberValue("module-sort-order"),
    published: getChecked("module-published")
  };
}

function resetThemeForm() {
  setValue("theme-id", "");
  setValue("theme-title", "");
  setValue("theme-description", "");
  setValue("theme-sort-order", "0");
  setChecked("theme-published", false);
}

function resetModuleForm() {
  setValue("module-id", "");
  setValue("module-title", "");
  setValue("module-summary", "");
  setValue("module-body", "");
  setValue("module-image-url", "");
  setValue("module-image-alt-text", "");
  setValue("module-video-url", "");
  setValue("module-challenge-text", "");
  setValue("module-sort-order", "0");
  setChecked("module-published", false);
}

function renderThemeOptions() {
  const select = document.getElementById("module-theme-id");
  if (!select) return;

  select.innerHTML = themes
    .map((theme) => `<option value="${theme.id}">${escapeHtml(theme.title)}</option>`)
    .join("");
}

function renderThemes() {
  const tbody = document.getElementById("themes-body");
  if (!tbody) return;

  if (themes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No themes yet</td></tr>';
    return;
  }

  tbody.innerHTML = themes
    .map(
      (theme) => `
        <tr>
          <td>${escapeHtml(theme.title)}</td>
          <td>${isPublished(theme.published) ? "Yes" : "No"}</td>
          <td>${theme.sortOrder}</td>
          <td>
            <button type="button" data-edit-theme="${theme.id}">Edit</button>
            <button type="button" data-delete-theme="${theme.id}">Delete</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderModules() {
  const tbody = document.getElementById("modules-body");
  if (!tbody) return;

  if (modules.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No modules yet</td></tr>';
    return;
  }

  const themeNames = new Map(themes.map((theme) => [theme.id, theme.title]));

  tbody.innerHTML = modules
    .map(
      (module) => `
        <tr>
          <td>${escapeHtml(module.title)}</td>
          <td>${escapeHtml(themeNames.get(module.themeId) || "-")}</td>
          <td>${isPublished(module.published) ? "Yes" : "No"}</td>
          <td>${module.sortOrder}</td>
          <td>
            <button type="button" data-edit-module="${module.id}">Edit</button>
            <button type="button" data-delete-module="${module.id}">Delete</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderUploads() {
  const tbody = document.getElementById("uploads-body");
  if (!tbody) return;

  const allUploads = [
    ...(uploads.images || []),
    ...(uploads.videos || [])
  ].sort((a, b) => String(b.modifiedAt).localeCompare(String(a.modifiedAt)));

  if (allUploads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No uploads yet</td></tr>';
    return;
  }

  tbody.innerHTML = allUploads
    .map((item) => {
      const references = item.referencedBy?.length
        ? item.referencedBy.map((module) => escapeHtml(module.title)).join(", ")
        : "Not used";
      const useTarget = item.type === "image" ? "image" : "video";

      return `
        <tr>
          <td>${item.type === "image" ? "Image" : "Video"}</td>
          <td><code>${escapeHtml(item.url)}</code></td>
          <td>${formatBytes(item.size)}</td>
          <td>${references}</td>
          <td><button type="button" data-use-upload="${escapeHtml(item.url)}" data-use-upload-type="${useTarget}">Use</button></td>
        </tr>
      `;
    })
    .join("");
}

async function loadContent() {
  if (!themeForm || !moduleForm) return;

  try {
    [themes, modules, uploads] = await Promise.all([
      apiFetch(endpoints.adminThemes),
      apiFetch(endpoints.adminModules),
      apiFetch(endpoints.adminUploads)
    ]);

    renderThemeOptions();
    renderThemes();
    renderModules();
    renderUploads();
  } catch (error) {
    setMessage(error.message, true);
  }
}

function editTheme(id) {
  const theme = themes.find((item) => item.id === Number(id));
  if (!theme) return;

  setValue("theme-id", theme.id);
  setValue("theme-title", theme.title);
  setValue("theme-description", theme.description);
  setValue("theme-sort-order", theme.sortOrder);
  setChecked("theme-published", isPublished(theme.published));
}

function editModule(id) {
  const module = modules.find((item) => item.id === Number(id));
  if (!module) return;

  setValue("module-id", module.id);
  setValue("module-theme-id", module.themeId);
  setValue("module-title", module.title);
  setValue("module-summary", module.summary);
  setValue("module-body", module.body);
  setValue("module-image-url", module.imageUrl);
  setValue("module-image-alt-text", module.imageAltText);
  setValue("module-video-url", module.videoUrl);
  setValue("module-challenge-text", module.challengeText);
  setValue("module-sort-order", module.sortOrder);
  setChecked("module-published", isPublished(module.published));
}

async function deleteTheme(id) {
  const theme = themes.find((item) => item.id === Number(id));
  if (!theme) return;

  const confirmed = window.confirm(
    `Delete theme "${theme.title}"? This also deletes its modules.`
  );
  if (!confirmed) return;

  try {
    await apiFetch(`${endpoints.adminThemes}/${id}`, {
      method: "DELETE"
    });

    if (getValue("theme-id") === String(id)) {
      resetThemeForm();
    }

    setMessage("Theme deleted.");
    await loadContent();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function deleteModule(id) {
  const module = modules.find((item) => item.id === Number(id));
  if (!module) return;

  const confirmed = window.confirm(`Delete module "${module.title}"?`);
  if (!confirmed) return;

  try {
    await apiFetch(`${endpoints.adminModules}/${id}`, {
      method: "DELETE"
    });

    if (getValue("module-id") === String(id)) {
      resetModuleForm();
    }

    setMessage("Module deleted.");
    await loadContent();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function uploadMedia({ inputId, endpoint, fieldName, responseKey, targetInputId }) {
  const input = document.getElementById(inputId);
  const file = input?.files?.[0];

  if (!file) {
    setMessage("Choose a file before uploading.", true);
    return;
  }

  const formData = new FormData();
  formData.append(fieldName, file);

  try {
    const result = await apiFetch(endpoint, {
      method: "POST",
      body: formData
    });

    setValue(targetInputId, result[responseKey]);
    clearFileInput(inputId);
    setMessage("Upload complete. Save the module to keep this media.");
    await loadContent();
  } catch (error) {
    setMessage(error.message, true);
  }
}

themeForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = getValue("theme-id");
  const method = id ? "PUT" : "POST";
  const endpoint = id ? `${endpoints.adminThemes}/${id}` : endpoints.adminThemes;

  try {
    await apiFetch(endpoint, {
      method,
      body: JSON.stringify(themePayload())
    });

    setMessage("Theme saved.");
    resetThemeForm();
    await loadContent();
  } catch (error) {
    setMessage(error.message, true);
  }
});

moduleForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = getValue("module-id");
  const method = id ? "PUT" : "POST";
  const endpoint = id ? `${endpoints.adminModules}/${id}` : endpoints.adminModules;

  try {
    await apiFetch(endpoint, {
      method,
      body: JSON.stringify(modulePayload())
    });

    setMessage("Module saved.");
    resetModuleForm();
    await loadContent();
  } catch (error) {
    setMessage(error.message, true);
  }
});

document.getElementById("theme-reset")?.addEventListener("click", resetThemeForm);
document.getElementById("module-reset")?.addEventListener("click", resetModuleForm);

document.getElementById("upload-image-button")?.addEventListener("click", () => {
  uploadMedia({
    inputId: "module-image-file",
    endpoint: endpoints.adminUploadImage,
    fieldName: "image",
    responseKey: "imageUrl",
    targetInputId: "module-image-url"
  });
});

document.getElementById("clear-image-file-button")?.addEventListener("click", () => {
  clearFileInput("module-image-file");
  setMessage("Selected image cleared.");
});

document.getElementById("clear-image-path-button")?.addEventListener("click", () => {
  setValue("module-image-url", "");
  setValue("module-image-alt-text", "");
  clearFileInput("module-image-file");
  setMessage("Image path cleared. Save the module to remove it from this module.");
});

document.getElementById("upload-video-button")?.addEventListener("click", () => {
  uploadMedia({
    inputId: "module-video-file",
    endpoint: endpoints.adminUploadVideo,
    fieldName: "video",
    responseKey: "videoUrl",
    targetInputId: "module-video-url"
  });
});

document.getElementById("clear-video-file-button")?.addEventListener("click", () => {
  clearFileInput("module-video-file");
  setMessage("Selected video cleared.");
});

document.getElementById("clear-video-path-button")?.addEventListener("click", () => {
  setValue("module-video-url", "");
  clearFileInput("module-video-file");
  setMessage("Video path cleared. Save the module to remove it from this module.");
});

document.addEventListener("click", (event) => {
  const themeButton = event.target.closest("[data-edit-theme]");
  const moduleButton = event.target.closest("[data-edit-module]");
  const deleteThemeButton = event.target.closest("[data-delete-theme]");
  const deleteModuleButton = event.target.closest("[data-delete-module]");
  const useUploadButton = event.target.closest("[data-use-upload]");

  if (useUploadButton) {
    const type = useUploadButton.dataset.useUploadType;
    const url = useUploadButton.dataset.useUpload;
    setValue(type === "image" ? "module-image-url" : "module-video-url", url);
    setMessage(`${type === "image" ? "Image" : "Video"} path selected. Save the module to keep it.`);
    return;
  }

  if (deleteThemeButton) {
    deleteTheme(deleteThemeButton.dataset.deleteTheme);
    return;
  }

  if (deleteModuleButton) {
    deleteModule(deleteModuleButton.dataset.deleteModule);
    return;
  }

  if (themeButton) {
    editTheme(themeButton.dataset.editTheme);
    return;
  }

  if (moduleButton) {
    editModule(moduleButton.dataset.editModule);
  }
});

loadContent();
