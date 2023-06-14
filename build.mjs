import { execSync } from "child_process";
import {
  readFileSync,
  writeFileSync,
} from "fs";

execSync("rm -rf boring-avatars", { stdio: "inherit" });

execSync("git clone https://github.com/boringdesigners/boring-avatars", {
  stdio: "inherit",
});

{
  const packageJson = JSON.parse(readFileSync("boring-avatars/package.json"));

  packageJson.name = "boring-avatars-esm";
  packageJson.repository = "https://github.com/lu-zen/boring-avatars-esm";
  packageJson.type = "module";
  delete packageJson.main;

  packageJson.devDependencies["vite"] = "^4.3.2";
  packageJson.devDependencies["@vitejs/plugin-react"] = "^4.0.0";
  packageJson.devDependencies["esbuild"] = "^0.17.19";

  packageJson.scripts["build"] = "vite build";

  delete packageJson.exports;

  packageJson.files = ["dist/*", "index.d.ts"];
  packageJson.exports = {
    ".": {
      import: "./dist/boring-avatars-esm.js",
      require: "./dist/boring-avatars-esm.cjs",
      types: "./index.d.ts",
    },
  };

  console.log("package.json", packageJson);

  writeFileSync(
    "boring-avatars/package.json",
    JSON.stringify(packageJson, undefined, "\t"),
  );
}

{
  const viteConfigContent = `
  import { resolve } from 'path'
  import { defineConfig } from 'vite'
  
  
  export default defineConfig({
    build: {
      copyPublicDir: false,
      sourcemap: true,
      minify: true,
      emptyOutDir: true,
      lib: {
        entry: resolve(__dirname, 'src/lib/components/avatar.js'),
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
      },
    },
    esbuild: {
      loader: "jsx",
      include: /src\\/.*\\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          {
            name: "load-js-files-as-jsx",
            setup(build) {
              build.onLoad({ filter:  /src\\/.*\\.js$/ }, async (args) => ({
                loader: { ".js": "jsx" },
                contents: await fs.readFile(args.path, "utf8"),
              }));
            },
          },
        ],
      },
    },
  })  
`;

  writeFileSync("boring-avatars/vite.config.js", viteConfigContent, {
    encoding: "utf-8",
  });
}

{
  const typing = readFileSync("boring-avatars/index.d.ts", "utf-8").replace(
    'module "boring-avatars"',
    'module "boring-avatars-esm"',
  );

  writeFileSync("boring-avatars/index.d.ts", typing);
}

execSync("npm install", { cwd: "boring-avatars", stdio: "inherit" });

execSync("npm run build", { cwd: "boring-avatars", stdio: "inherit" });
