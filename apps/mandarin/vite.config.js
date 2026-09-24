import { defineConfig } from 'vite';

// base 用相對路徑：部署位置不固定（GitHub Pages 子路徑
// /Teaching-Materials/mandarin/、本機預覽、未來可能的自訂網域都要能動），
// 不可假設 domain root。
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
