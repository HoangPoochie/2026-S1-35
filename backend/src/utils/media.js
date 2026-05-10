import path from "path";

export const IMAGE_UPLOAD_SUBDIR = "images";
export const VIDEO_UPLOAD_SUBDIR = "videos";

const EXTERNAL_MEDIA_PROTOCOLS = new Set(["http:", "https:"]);

function buildLocalUploadPattern(subdir) {
  return new RegExp(`^/uploads/${subdir}/[A-Za-z0-9._-]+$`);
}

const localUploadPatterns = {
  image: buildLocalUploadPattern(IMAGE_UPLOAD_SUBDIR),
  video: buildLocalUploadPattern(VIDEO_UPLOAD_SUBDIR)
};

export function resolveUploadDir(uploadDir) {
  if (path.isAbsolute(uploadDir)) {
    return uploadDir;
  }

  return path.resolve(process.cwd(), uploadDir);
}

export function isExternalMediaUrl(value) {
  try {
    const url = new URL(value);
    return EXTERNAL_MEDIA_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export function isLocalUploadPath(value, type) {
  const pattern = localUploadPatterns[type];
  return Boolean(pattern?.test(value));
}

export function isMediaReference(value, type) {
  return value === "" || isExternalMediaUrl(value) || isLocalUploadPath(value, type);
}
