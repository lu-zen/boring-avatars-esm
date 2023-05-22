import { execSync } from 'child_process';
import { readFileSync, readdirSync, writeFileSync, renameSync, mkdirSync } from 'fs';
import { resolve } from 'path'

execSync('rm -rf boring-avatars', { stdio: 'inherit' });

execSync('git clone https://github.com/boringdesigners/boring-avatars', { stdio: 'inherit' });

{
    const packageJson = JSON.parse(readFileSync('boring-avatars/package.json'));

    packageJson.name = 'boring-avatars-esm';
    packageJson.repository = 'https://github.com/lu-zen/boring-avatars-esm';
    packageJson.type = 'module';
    delete packageJson.main;

    packageJson.devDependencies['vite'] = '^4.3.2';
    packageJson.devDependencies['@vitejs/plugin-react'] = '^4.0.0';
    packageJson.devDependencies['esbuild'] = '^0.17.19';

    packageJson.scripts['build'] = "vite build"


    delete packageJson.exports;

    packageJson.files = ["dist/*", "index.d.ts"];
    packageJson.exports = {
      '.': {
        import: './dist/boring-avatars-esm.js',
        require: './dist/boring-avatars-esm.cjs',
        types: "./index.d.ts"
      },
    }

    console.log('package.json', packageJson);

    writeFileSync('boring-avatars/package.json', JSON.stringify(packageJson, undefined, '\t'));
}

{
    const tsconfigJson =
            `
            {
                "compilerOptions": {
                  "target": "ESNext",
                  "lib": ["DOM", "DOM.Iterable", "ESNext"],
                  "module": "ESNext",
                  "skipLibCheck": true,
              
                  /* Bundler mode */
                  "moduleResolution": "bundler",
                  "allowImportingTsExtensions": true,
                  "resolveJsonModule": true,
                  "isolatedModules": true,
                  "noEmit": true,
                  "jsx": "react-jsx",
              
                  /* Linting */
                  "strict": true,
                  "noUnusedLocals": true,
                  "noUnusedParameters": true,
                  "noFallthroughCasesInSwitch": true
                },
                "include": ["src"],
              }
            `;
    console.log('tsconfig.json', tsconfigJson);

    writeFileSync('boring-avatars/tsconfig.json', JSON.stringify(tsconfigJson, undefined, '\t'));
}

{
const viteConfigContent = `

import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import * as esbuild from "esbuild";

const rollupPlugin = (matchers) => ({
  name: "js-in-jsx",
  load(id) {
    if (matchers.some(matcher => matcher.test(id))) {
      const file = fs.readFileSync(id, { encoding: "utf-8" });
      return esbuild.transformSync(file, { loader: "jsx" });
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/lib/components/avatar.js'),
      formats: ['es', 'cjs'],
      rollupOptions: {
        plugins: [
          rollupPlugin([/\\/src\\/.*\\.js$/])
        ],
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  esbuild: {
    loader: "jsx",
    include: /\\/src\\/lib\\/.*\\.js$/,
    exclude: [],
  },
})
`;

writeFileSync('boring-avatars/vite.config.js', viteConfigContent, {encoding: 'utf-8'});
}

{
  const typing = readFileSync('boring-avatars/index.d.ts', 'utf-8')
  .replace("module \"boring-avatars\"", "module \"boring-avatars-esm\"");
  
  writeFileSync('boring-avatars/index.d.ts', typing);
}

execSync('npm install', { cwd: 'boring-avatars', stdio: 'inherit' });

execSync('npm run build', { cwd: 'boring-avatars', stdio: 'inherit' });
