import { customAlphabet } from "nanoid";

const submissionCodeId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

export function createSubmissionCode() {
  return `sub_${submissionCodeId()}`;
}
