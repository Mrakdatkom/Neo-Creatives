import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    // Custom plugin to copy sections and models
    {
      name: 'copy-assets-plugin',
      closeBundle() {
        // Copy sections
        const sourceDir = 'public/sections';
        const targetDir = 'dist/sections';

        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }

        if (existsSync(sourceDir)) {
          const files = readdirSync(sourceDir);
          files.forEach(file => {
            if (file.endsWith('.html')) {
              const srcPath = join(sourceDir, file);
              const destPath = join(targetDir, file);
              copyFileSync(srcPath, destPath);
              console.log(`📄 Copied ${srcPath} to ${destPath}`);
            }
          });
        }

        // Copy models
        const modelSource = 'public/models';
        const modelTarget = 'dist/models';

        if (!existsSync(modelTarget)) {
          mkdirSync(modelTarget, { recursive: true });
        }

        if (existsSync(modelSource)) {
          const files = readdirSync(modelSource);
          files.forEach(file => {
            const srcPath = join(modelSource, file);
            const destPath = join(modelTarget, file);
            copyFileSync(srcPath, destPath);
            console.log(`📄 Copied ${srcPath} to ${destPath}`);
          });
        }
      }
    }
  ],
  base: '/',
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true,
  },
  publicDir: 'public',
  assetsInclude: ['**/*.html', '**/*.gltf', '**/*.glb'],
});