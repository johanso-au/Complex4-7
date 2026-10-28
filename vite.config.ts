import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

// Short commit id shown on the title screen, so a cached old build is easy to spot.
function buildId(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

// GitHub Pages serves the site from /Complex4-7/, so asset URLs need that prefix.
export default defineConfig({
  base: '/Complex4-7/',
  define: { __BUILD__: JSON.stringify(buildId()) },
});
