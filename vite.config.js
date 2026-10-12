import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';

// Builds the Chatterbox posts (content/posts/) every time Vite starts or builds,
// so new posts appear even if the host runs `vite build` directly instead of `npm run build`.
const posts = () => ({
  name: 'agile-build-posts',
  buildStart() {
    execFileSync(process.execPath, ['scripts/build-posts.mjs'], { stdio: 'inherit' });
  },
});

export default defineConfig({ plugins: [posts()] });
