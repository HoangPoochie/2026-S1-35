
import { customAlphabet } from "nanoid";

const nano = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 16);

export function createSubmissionCode() {
  return `sub_${nano()}`;
}
