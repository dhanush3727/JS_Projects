## Custom Module Bundler
1. What is a Custom Module Bundler?
A Module bundler is a tool that:
    - Reads our JavaScript files.
    - Finds all the import/require() dependencies.
    - Builds a dependency graph.
    - Combines everything into a single optimized output file.
    - Browser can run that single file.
In simple words:
    It takes many JS files -> analyzes -> Bundles into a 1 final file.

2. Why do we need a bundler?
The browser doesn't naturally understand:
    - Node style imports (require).
    - ES modules from multiple files.
    - JSX (React)
    - TypeScript
    - SASS/CSS
    - Tree-Shaking
    - Code splitting
But a custom bundler solves this

3. What this project will do?
In this project, The bundler will:
    - Take an entry file(ex: index.js).
    - Parse it using an AST.
    - Detect all imports.
    - Create a dependency graph.
    - Bundle everything into a single file.

4. Dependency Graph:
A dependency graph is a structure that shows:
    - Which file depends on which other files.
    - How all our modules are connected.

5. AST - Abstract Syntax Tree:
An AST(Abstract syntax Tree) is a tree-structured representation of your JavaScript code. When a bundler wants to understand your code, it can't read text directly. It needs a structured format. So the raw source code is parsed into a tree where:
    - Each node represents something in your code.
    - Example nodes:
        - ImportDeclaration
        - VariableDeclaration
        - FunctionDeclaration
        - CallExpression
Example:
```javascript
import { add } from "./add.js";
console.log(add(1, 2));
```
AST:
Program
 ├── ImportDeclaration
 │     ├── source: "./add.js"
 │     └── specifiers: add
 └── ExpressionStatement
       └── CallExpression
             ├── callee: console.log
             └── arguments: add(1,2)

6. Why do bundlers use an AST?
Bundlers use AST because they need to:
- Find all imports: So they can build the dependency graph.
- Transform code:
    - Convert ES modules -> CommonJS
    - Apply Babel transformations
    - Minify code
- Understand the structure of our code: 
    - Instead of guessing with regex. Bundler uses AST to detect:
    `import something from "./file.js";` by reading its `ImportDeclaration` node.

# Code Explanation:
```javascript
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

let id = 0;
```
fs - read .js files
path - resolve imports like "./add.js" -> absolute path
parser - detect import/export using AST
traverse - find all ImportDeclaration nodes
babel - convert ES modules to CommonJS so bundler can run them
id - generate module identifiers 

```javascript
function createAsset(fileName) {
  const fullPath = path.resolve(fileName);
  const content = fs.readFileSync(fullPath, "utf-8");

  // 1. Convert code to AST
  const ast = parser.parse(content, {
    sourceType: "module",
  });

  const dependencies = [];

  // 2. Traverse AST and find imports
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });

  //   Convert ES6 -> CommonJS
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
```
1. This function reads a file and extracts:
    - Its dependencies (`import ...`).
    - Its transformed code
    - A unique module ID
Bundlers must always work with absolute paths.
2. Parse file into AST:
    - We cannot reliably detect imports with regex.
    - AST is the correct professional method.
3. Collect dependencies:
    - Every import represents a new module that we must process later.
4. Convert ES6 to CommonJS:
    - Browsers cannot run our bundled code with `import/export` inside function wrappers. CommonJS is easier to simulate using:
    `function (require, module, exports) { ... }`
    So we transform:
    `import { add } from "./add.js";`
    into:
    `var _add = require("./add.js");`
5. Return module asset object.

```javascript
function createGraph(entry) {
  const mainAsset = createAsset(entry);
  const queue = [mainAsset];

  for (const asset of queue) {
    const dirname = path.dirname(asset.fileName);
    asset.mapping = {};

    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);

      const child = createAsset(absolutePath);
      asset.mapping[relativePath] = child.id;

      queue.push(child);
    });
  }

  return queue;
}
```
1. This function builds the entire graph starting from entry file.
    - Bundler must follow imports like a tree
    - index -> add -> sub
    - index -> multiple -> divide
2. Walk graph and process each dependency
    - If index.js imports `"./add.js"`, we must read: src/add.js
3. Create child asset
    - This mapping helps localRequire() find correct module.
4. Add to queue

```javascript
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
```
1. This function converts the entire dependency graph into one big JS file.
2. Create `modules` object:
    - Each module has a function wrapper and dependency map.
3. The bundler runtime:
    - We use an IIFE to create module system.
**NOTES: IIFE(Immediately Invoked Function Expression) is a function that runs as soon as it is defined.**
4. Implement custom `require()`
    - `mapping` tells which dependency ID to load.
5. Create module object
    - `modue.exports` holds returned values like Node.js.
    - Execute function wrapper so its code runs.
6. Write final bundle
    - It will create a `bundle.js` file

# Output
After create a `bundle.js` file run this file it give the output like
Sub: -1
Divide: 4
hello
Add: 3
Multiple: 2
Why the output give like this?
Because imported modules executed immediately when they are loaded.
`import { add } from "./add.js";`
- The file `add.js` is loaded and all top level code inside that file executes immediately, not when we call the function.
