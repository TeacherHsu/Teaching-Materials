import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const filterScript = fileURLToPath(new URL('./filter-build-data.mjs', import.meta.url));
const result = spawnSync(process.execPath, [filterScript], {
  stdio: 'inherit',
  env: {
    ...process.env,
    MANDARIN_BUILD_PREVIEW: '1',
    MANDARIN_DIST_DIR: 'dist-preview',
  },
});

if (result.error) {
  console.error(`無法執行預覽資料篩選器：${result.error.message}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
