import { apiFetch } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";

let themes = [];
let modules = [];
let uploads = { images: [], videos: [] };
let moduleMediaItems = [];

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

function normalizeMediaItems(items = []) {
  return items
    .filter((item) => item?.url)
    .map((item, index) => ({
      mediaType: item.mediaType === "video" ? "video" : "image",
      url: String(item.url || "").trim(),
      altText: String(item.altText || "").trim(),
      sortOrder: Number.isInteger(Number(item.sortOrder))
        ? Number(item.sortOrder)
        : index
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({ ...item, sortOrder: index }));
}

function legacyMediaItemsFromModule(module) {
  const items = [];

  if (module.imageUrl) {
    items.push({
      mediaType: "image",
      url: module.imageUrl,
      altText: module.imageAltText || "",
      sortOrder: 0
    });
  }

  if (module.videoUrl) {
    items.push({
      mediaType: "video",
      url: module.videoUrl,
      altText: "",
      sortOrder: items.length
    });
  }

  return items;
}

function resetMediaDraft() {
  setValue("module-media-type", "image");
  setValue("module-media-url", "");
  setValue("module-media-alt-text", "");
  setValue("module-media-sort-order", String(moduleMediaItems.length));
}

function setMediaDraft({ mediaType = "image", url = "", altText = "", sortOrder } = {}) {
  setValue("module-media-type", mediaType);
  setValue("module-media-url", url);
  setValue("module-media-alt-text", altText);
  setValue(
    "module-media-sort-order",
    String(Number.isInteger(Number(sortOrder)) ? Number(sortOrder) : moduleMediaItems.length)
  );
}

function renderModuleMediaItems() {
  const tbody = document.getElementById("module-media-body");
  if (!tbody) return;

  moduleMediaItems = normalizeMediaItems(moduleMediaItems);

  if (moduleMediaItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No media items added</td></tr>';
    return;
  }

  tbody.innerHTML = moduleMediaItems
    .map(
      (item, index) => `
        <tr>
          <td>${index}</td>
          <td>${item.mediaType === "image" ? "Image" : "Video"}</td>
          <td><code>${escapeHtml(item.url)}</code></td>
          <td>${escapeHtml(item.altText || "-")}</td>
          <td>
            <button type="button" data-move-media="${index}" data-move-media-dir="-1">Up</button>
            <button type="button" data-move-media="${index}" data-move-media-dir="1">Down</button>
            <button type="button" data-edit-media="${index}">Edit</button>
            <button type="button" data-remove-media="${index}">Remove</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function addMediaItemFromDraft() {
  const mediaType = getValue("module-media-type") === "video" ? "video" : "image";
  const url = getValue("module-media-url");
  const altText = getValue("module-media-alt-text");
  const sortOrder = getNumberValue("module-media-sort-order");

  if (!url) {
    setMessage("Add a media URL or upload path first.", true);
    return;
  }

  moduleMediaItems.push({ mediaType, url, altText, sortOrder });
  moduleMediaItems = normalizeMediaItems(moduleMediaItems);
  renderModuleMediaItems();
  resetMediaDraft();
  setMessage("Media item added. Save the module to keep the media list.");
}

function removeMediaItem(index) {
  moduleMediaItems.splice(index, 1);
  moduleMediaItems = normalizeMediaItems(moduleMediaItems);
  renderModuleMediaItems();
  resetMediaDraft();
  setMessage("Media item removed. Save the module to keep this change.");
}

function editMediaItem(index) {
  const item = moduleMediaItems[index];
  if (!item) return;
  setMediaDraft({ ...item, sortOrder: index });
}

function moveMediaItem(index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= moduleMediaItems.length) return;

  const [item] = moduleMediaItems.splice(index, 1);
  moduleMediaItems.splice(nextIndex, 0, item);
  moduleMediaItems = normalizeMediaItems(moduleMediaItems);
  renderModuleMediaItems();
  resetMediaDraft();
  setMessage("Media order changed. Save the module to keep this order.");
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
  const mediaItems = normalizeMediaItems(moduleMediaItems);
  const firstImage = mediaItems.find((item) => item.mediaType === "image");
  const firstVideo = mediaItems.find((item) => item.mediaType === "video");

  return {
    themeId: Number(getValue("module-theme-id")),
    title: getValue("module-title"),
    summary: getValue("module-summary"),
    body: getValue("module-body"),
    imageUrl: firstImage?.url || "",
    imageAltText: firstImage?.altText || "",
    videoUrl: firstVideo?.url || "",
    challengeText: getValue("module-challenge-text"),
    sortOrder: getNumberValue("module-sort-order"),
    published: getChecked("module-published"),
    mediaItems
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
  setValue("module-challenge-text", "");
  setValue("module-sort-order", "0");
  setChecked("module-published", false);
  moduleMediaItems = [];
  renderModuleMediaItems();
  resetMediaDraft();
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
          <td>
            <button type="button" data-use-upload="${escapeHtml(item.url)}" data-use-upload-type="${useTarget}">Use</button>
            <button type="button" data-delete-upload="${escapeHtml(item.filename)}" data-delete-upload-type="${useTarget}" data-delete-upload-url="${escapeHtml(item.url)}">Delete</button>
          </td>
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
  setValue("module-challenge-text", module.challengeText);
  setValue("module-sort-order", module.sortOrder);
  setChecked("module-published", isPublished(module.published));
  moduleMediaItems = normalizeMediaItems(
    module.mediaItems?.length ? module.mediaItems : legacyMediaItemsFromModule(module)
  );
  renderModuleMediaItems();
  resetMediaDraft();
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

async function deleteUpload({ type, filename, url }) {
  const label = type === "image" ? "image" : "video";
  const confirmed = window.confirm(
    `Delete this ${label} upload? Any module media entries using it will also be removed.`
  );
  if (!confirmed) return;

  try {
    await apiFetch(`${endpoints.adminUploads}/${type}/${encodeURIComponent(filename)}`, {
      method: "DELETE"
    });

    moduleMediaItems = moduleMediaItems.filter((item) => item.url !== url);
    renderModuleMediaItems();
    resetMediaDraft();
    setMessage(`${label[0].toUpperCase()}${label.slice(1)} upload deleted.`);
    await loadContent();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function uploadMedia({ inputId, endpoint, fieldName, responseKey, mediaType }) {
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

    moduleMediaItems.push({
      mediaType,
      url: result[responseKey],
      altText: "",
      sortOrder: moduleMediaItems.length
    });
    renderModuleMediaItems();
    resetMediaDraft();
    clearFileInput(inputId);
    setMessage("Upload added to this module. Save the module to keep this media.");
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
    mediaType: "image"
  });
});

document.getElementById("clear-image-file-button")?.addEventListener("click", () => {
  clearFileInput("module-image-file");
  setMessage("Selected image cleared.");
});

document.getElementById("upload-video-button")?.addEventListener("click", () => {
  uploadMedia({
    inputId: "module-video-file",
    endpoint: endpoints.adminUploadVideo,
    fieldName: "video",
    responseKey: "videoUrl",
    mediaType: "video"
  });
});

document.getElementById("clear-video-file-button")?.addEventListener("click", () => {
  clearFileInput("module-video-file");
  setMessage("Selected video cleared.");
});

document.getElementById("add-media-item-button")?.addEventListener("click", addMediaItemFromDraft);
document.getElementById("reset-media-item-button")?.addEventListener("click", () => {
  resetMediaDraft();
  setMessage("Media draft cleared.");
});

document.addEventListener("click", (event) => {
  const themeButton = event.target.closest("[data-edit-theme]");
  const moduleButton = event.target.closest("[data-edit-module]");
  const deleteThemeButton = event.target.closest("[data-delete-theme]");
  const deleteModuleButton = event.target.closest("[data-delete-module]");
  const useUploadButton = event.target.closest("[data-use-upload]");
  const deleteUploadButton = event.target.closest("[data-delete-upload]");
  const removeMediaButton = event.target.closest("[data-remove-media]");
  const editMediaButton = event.target.closest("[data-edit-media]");
  const moveMediaButton = event.target.closest("[data-move-media]");

  if (moveMediaButton) {
    moveMediaItem(
      Number(moveMediaButton.dataset.moveMedia),
      Number(moveMediaButton.dataset.moveMediaDir)
    );
    return;
  }

  if (editMediaButton) {
    editMediaItem(Number(editMediaButton.dataset.editMedia));
    return;
  }

  if (removeMediaButton) {
    removeMediaItem(Number(removeMediaButton.dataset.removeMedia));
    return;
  }

  if (deleteUploadButton) {
    deleteUpload({
      type: deleteUploadButton.dataset.deleteUploadType,
      filename: deleteUploadButton.dataset.deleteUpload,
      url: deleteUploadButton.dataset.deleteUploadUrl
    });
    return;
  }

  if (useUploadButton) {
    const type = useUploadButton.dataset.useUploadType;
    const url = useUploadButton.dataset.useUpload;
    setMediaDraft({ mediaType: type, url });
    setMessage(`${type === "image" ? "Image" : "Video"} path selected. Add it to the module media list, then save.`);
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

renderModuleMediaItems();
resetMediaDraft();
loadContent();
