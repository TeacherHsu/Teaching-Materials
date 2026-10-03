// 教室密碼不寫進程式碼（repo 是公開的，寫進來等於公開密碼）。
// 來源順序：環境變數 CLASSROOM_PASSWORD → 本機 ~/mandarin-work/.classroom-password。
// 都沒有就回 null，需要解密的測試與工具會略過或停下，而不是用寫死的值。
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export function classroomPassword() {
  if (process.env.CLASSROOM_PASSWORD) return process.env.CLASSROOM_PASSWORD;
  try {
    return readFileSync(path.join(homedir(), 'mandarin-work', '.classroom-password'), 'utf8').trim() || null;
  } catch {
    return null;
  }
}
