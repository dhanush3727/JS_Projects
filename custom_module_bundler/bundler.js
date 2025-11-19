const fs = require("fs"); // reading file contents
const path = require("path"); // resolving absolute + relative paths
const parser = require("@babel/parser"); // converts JS code to AST
const traverse = require("@babel/traverse").default; // Walks through AST nodes
const babel = require("@babel/core"); // Used to transform ES6 to CommonJS

let id = 0; // Each module gets an ID

function createAsset(fileName) {
  const fullPath = path.resolve(fileName); // Convert relative path -> absolute path
  const content = fs.readFileSync(fullPath, "utf-8"); // Read file text

  // 1. Convert code to AST
  const ast = parser.parse(content, {
    sourceType: "module", // Enables ES6 import/export support
  });

  const dependencies = [];

  // 2. Traverse AST and find imports
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value); // Example: "./add.js"
    },
  });

  //   Convert ES6 to CommonJS
  const { code } = babel.transformFromAstSync(ast, content, {
    presets: ["@babel/preset-env"],
  });

  return {
    id: id++,
    fileName,
    dependencies,
    code,
  };
}

function createGraph(entry) {
  const mainAsset = createAsset(entry); // Process entry module
  const queue = [mainAsset]; // Queue

  for (const asset of queue) {
    const dirname = path.dirname(asset.fileName);
    asset.mapping = {}; // Maps dependency -> module.id

    // Process each dependency
    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);

      // Create child asset
      const child = createAsset(absolutePath);
      asset.mapping[relativePath] = child.id;

      // Add to queue
      queue.push(child);
    });
  }

  return queue;
}

function bundle(graph) {
  let modules = "";

  graph.forEach((mod) => {
    modules += `${mod.id}: [
    function(require, module, exports){
    ${mod.code}
    },
    ${JSON.stringify(mod.mapping)}
    ],
    `;
  });

  const result = `
  (function(modules){
  function require(id){
  const [fn, mapping] = modules[id];

  function localRequire(relativePath){
  return require(mapping[relativePath]);
  }

  const module = {exports: {}};
  fn(localRequire, module, module.exports);

  return module.exports;
  }

  require(0);
  })({${modules}})
  `;

  // Write to bundle.js
  fs.writeFileSync("bundle.js", result);
}

const graph = createGraph("./src/index.js");
bundle(graph);