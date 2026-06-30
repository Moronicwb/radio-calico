#!/usr/bin/env node
// Minifies JS and CSS into dist/ and copies all other public assets.
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "../public");
const OUT = path.join(__dirname, "../dist");

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Minify JS
esbuild.buildSync({
  entryPoints: [path.join(SRC, "app.js")],
  outfile: path.join(OUT, "app.js"),
  minify: true,
  target: "es2020",
});

// Minify CSS
esbuild.buildSync({
  entryPoints: [path.join(SRC, "styles.css")],
  outfile: path.join(OUT, "styles.css"),
  minify: true,
});

// Copy everything else (HTML, images, fonts, etc.)
const skip = new Set(["app.js", "styles.css"]);
for (const file of fs.readdirSync(SRC)) {
  if (!skip.has(file)) {
    fs.copyFileSync(path.join(SRC, file), path.join(OUT, file));
  }
}

const jsSize   = fs.statSync(path.join(OUT, "app.js")).size;
const cssSize  = fs.statSync(path.join(OUT, "styles.css")).size;
const jsSrc    = fs.statSync(path.join(SRC, "app.js")).size;
const cssSrc   = fs.statSync(path.join(SRC, "styles.css")).size;
console.log(`app.js    ${jsSrc} → ${jsSize} bytes (${Math.round((1 - jsSize/jsSrc)*100)}% smaller)`);
console.log(`styles.css ${cssSrc} → ${cssSize} bytes (${Math.round((1 - cssSize/cssSrc)*100)}% smaller)`);
console.log("Build complete → dist/");
