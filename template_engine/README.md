## Template Engine
A template engine is a system that take a template(a string with placeholder) and data(an object) and combines then to generate the final output - usually HTML.
Ex:
Template
```html
<h1>{{title}}</h1>
<p>{{message}}</p>
```
Data
```javascript
data = {
    title: "Hello",
    message : "Welcome to my site"
}
```
Output
```html
<h1>Hello</h1>
<p>Welcom to my site</p>
```
So template engine is basically dynamic HTML generator.

# Tokenization
Tokenization is the step that convert the raw template string into a sequence of tokens the parser can consume. Think of it as chopping the template into meaningful chunks: text, opening tags, closing tags, variables, block start, etc.
What is a token?
A token is a small object that represents a meaningful piece of the input.
Ex:
```js
{ type: "text", value: "<h1>Hello</h1>", start: 0, end: 14 }
{ type: "variable", value: "user.name", start: 14, end: 27 }
{ type: "blockStart", block: "if", expression: "isLogged", start: 27, end: 45 }
{ type: "blockEnd", block: "if", start: 100, end: 106 }
```
In this example,
- `type`: token kind(`text`, `variable`, `blockStart`, `blockEnd`, `partial`, etc).
- `value` or `expression`: the inner text(variable name, expression).
- optional `block`: for `#if`, `#each` tokens(`if`, `each`).
- `start` and `end`: numeric indices(useful for error messages and mapping tokens back to source).
- maybe `line`/`col` if you want prettier errors.

# AST(Abstract Syntax Tree)
AST is just a structured representation of your template.
```
<h1>{{title}}</h1>
{{#if isLogged}}
  Welcome, {{user.name}}
{{/if}}
```
This is how we see but the computer cannot understand this directly.  So we convert it into a tree of objects. This tree is AST.
It is "abstruct" because it ignores things like exact spacing of formatting. It is a "syntax tree" because it shows how things are nested.

Visual Explanation: 
```
{{#if isLogged}}
  Hello {{user.name}}
{{/if}}
```
Consider this template
AST becomes:
IfStatement
 ├── test: "isLogged"
 └── body:
      ├── Text: "Hello "
      └── Variable: "user.name"
This is a tree of nodes.

# Code Explanation
1. `tokenize(template)` Function:
```js
function tokenize(template) {
//   Help to change the HTML template as token
const tokens = [];
  const len = template.length;
  let cursor = 0;

  const throwError = (msg, pos = cursor) => {
    const error = new SyntaxError(`${msg} at position ${pos}`);
    error.position = pos;
    throw error;
  };
...
}
```
- `tokens`: Where we push token objects.
- `len`: cache template length(micro-opt).
- `cursor`: our current read position in the string
- `throwError`: helper to raise nice syntax errors with position info.
We need a mutable index so we can scan the string once, and a consistent way to raise errors when tags aren't closed.

```js
 while (cursor < len) {
    const open = template.indexOf("{{", cursor);
    if (open === -1) {
      if (cursor < len) {
        tokens.push({
          type: "text",
          value: template.slice(cursor),
          start: cursor,
          end: len,
        });
      }
      break;
    }
    ...
 }
```
- `indexOf("{{", cursor)`: finds the next opening mustache from the current cursor. Searching from `cursor` avoids re-scanning the already processed prefix.
- If no `{{` is found `open` is become `-1` the rest is plain text, push a `text` token with full remaining substring and break.
Everything outside `{{...}}` is plain text, we preserve it as a token for the renderer to emit unchanged.

```js
if (open > cursor) {
      tokens.push({
        type: "text",
        value: template.slice(cursor, open),
        start: cursor,
        end: open,
      });
    }
```
- If there's text between `cursor` and the next `{{`, create a `text` token for that substring.
We must keep the order and content of plain text exactly as in the original template.

```js
    let close;
    if (template.startsWith("{{{", open)) {
      close = template.indexOf("}}}", open + 3);
      if (close === -1) throwError("Unclosed triple-stash tag", open);
      const rawInner = template.slice(open + 3, close).trim();
      tokens.push({
        type: "rawVariable",
        value: rawInner,
        start: open,
        end: close + 3,
      });
      cursor = close + 3;
      continue;
    }
```
- `startsWith("{{{", open)`: tests if this tag is a triple-stash. Triple braces are commonly used to indicate, do not HTML - escape this value.
- We search for the matching `}}}` starting after the opening `{{{` so `open + 3`.
- Extract inner content with `slice(open + 3, close).trim()` and push a `rawVariable` token.
- Advance `cursor` past the closing `}}}`.
Why `+3` and `close + 3`: both opening and closing triple stashes are 3 characters long; we need to skip them to get the inner expression and to move the cursor past the whole tag.

```js
close = template.indexOf("}}", open + 2);
if (close === -1) throwError("Unclosed tag", open);
const inner = template.slice(open + 2, close).trim();
```
- Find the neareast `}}` after the `{{` (skip the two opening characters: `open + 2`).
- If not found, syntax error (unclosed tag).
- `inner` is the trimmed content inside the tag.
This extracts whatever the user put between `{{` and `}}` so we can classify it variable, block, helper, partial, etc.

```js
if (inner.length === 0) {
      tokens.push({
        type: "text",
        value: "{{}}",
        start: open,
        end: close + 2,
      });
      cursor = close + 2;
      continue;
    }
```
- If user wrote `{{}}` with nothing inside, treat that literally as text or recover gracefully.
Better UX avoid crashing on accidental empty tags.

```js
 if (inner[0] === "#") {
      const rest = inner.slice(1).trim();
      const [blockName, ...exprParts] = rest.split(/\s+/);
      const expression = exprParts.join(" ");
      tokens.push({
        type: "blockStart",
        block: blockName,
        expression,
        raw: inner,
        start: open,
        end: close + 2,
      });
      cursor = close + 2;
      continue;
    }
```
- If the first character is `#`, we have a block start. Ex: `{{#if isLogged}}` or `{{#each users}}`.
- `rest.split(/\s+/)` splits the rest by one or more whitespace chars. `/\s+/` means one or more whitespace characters -- this normalizes multiple spaces/tabs.
- `blockName` is the directive (`if`, `each`), `expression` is the rest of the words joined back ex: `isLogged` or `users`.
Blocks change control flow and create nesting parser will later use `blockStart` token to begin new AST nodes.

```js
if (inner[0] === "/") {
      const blockName = inner.slice(1).trim();
      tokens.push({
        type: "blockEnd",
        block: blockName,
        raw: inner,
        start: open,
        end: close + 2,
      });
      cursor = close + 2;
      continue;
    }
```
- If tag starts with `/` it’s a closing block. The parser matches `blockStart` and `blockEnd` by `block` name.
`blockEnd` acts as the stop-signal when the parser is building nested AST nodes.

```js
if (inner[0] === ">") {
      const name = inner.slice(1).trim();
      tokens.push({
        type: "partial",
        name,
        raw: inner,
        start: open,
        end: close + 2,
      });
      cursor = close + 2;
      continue;
    }
```
- `>` indicates partial includes (templates included from other files). Tokenizer records the partial name.
partials are a common templating feature, tokenizer recognizes them so the parser/renderer can later load or inject partial content.

```js
const spaceIndex = inner.indexOf(" ");
    if (spaceIndex > -1) {
      const helperName = inner.slice(0, spaceIndex).trim();
      const argsRaw = inner.slice(spaceIndex + 1).trim();
      tokens.push({
        type: "helper",
        name: helperName,
        args: argsRaw,
        raw: inner,
        start: open,
        end: close + 2,
      });
    } else {
      tokens.push({
        type: "variable",
        value: inner,
        raw: inner,
        start: open,
        end: close + 2,
      });
    }
    return tokens;
```
- If the tag contains a space, we assume it's a helper call and save the helper name + raw args.
- Otherwise it's a simple variable path like `user.name` or `this`.
- When cursor reaches the end the loop exits and we return the array of tokens.
Helpers provide function like transformations, the tokenizer flags them so the parser/renderer can call registered helper functions.

2. `parse(token)` Function:
```js
function parse(tokens) {
  let current = 0;
  ...
}
```
This `parse(token)` function turns the flat token list from your tokenizer into a tree (AST) your compiler/renderer can use.
- `current` is the cursor index into the `tokens` array. The parser advances this as it consumes tokens.
- Using a single cursor keeps the algorithm simple and linear.

```js
function walk() {
    let token = tokens[current];

    if (token.type === "text") {
      current++;
      return {
        type: "Text",
        value: token.value,
      };
    }

    if (token.type === "variable") {
      current++;
      return {
        type: "Variable",
        name: token.value,
      };
    }

    if (token.type === "blockStart") {
      return parseBlock();
    }

    throw new Error("Unknown token: " + JSON.stringify(token));
  }
```
- Reads the token at `tokens[current]` and creates a single AST node for it.
- For `text` and `variable` it:
    - consumes the token (`current++`) and
    - returns a simple AST node (`Text` or `Variable`) with the relevant data (`value` or `name`).
- For `blockStart` it delegates to `parseBlock()` because a block contains nested children (not a single node).
- If it encounters any token it doesn’t expect, it throws an error — this is defensive programming so you catch bugs early.
Why use a `walk()` function?
- Keeps parser modular and easy to read.
- Enables recursive parsing (blocks call `walk()` to parse their children), which naturally handles nesting.

```js
 function parseBlock() {
    const start = tokens[current++];
    const block = start.block;
    const expr = start.expression;

    const body = [];

    while (
      current < tokens.length &&
      !(tokens[current].type === "blockEnd" && tokens[current].block === block)
    ) {
      body.push(walk());
    }

    current++;

    if (block === "if") {
      return {
        type: "IfStatement",
        test: expr,
        body,
      };
    }

    if (block === "each") {
      return {
        type: "EachStatement",
        source: expr,
        body,
      };
    }
  }
```
- `const start = tokens[current++]`: Consume the blockStart token so current now points to the first token inside the block.
- `const block = start.block and const expr = start.expression`: Extract the block type (e.g. `"if"`, `"each"`) and its expression (`"isLogged"`, `"users"`), which become node properties.
- `const body = [];`: Prepare an array to collect child AST nodes belonging to this block.
- `while ( ... not matching blockEnd ...) { body.push(walk()); }`:
    - Repeatedly call `walk()` to parse inner tokens into AST nodes and append them to `body`.
    - The loop stops when it sees the corresponding `blockEnd` token (same `block` name).
    - This is the critical part that supports nesting — because `walk()` will call `parseBlock()` again for nested blocks.
- `current++;`: Consume the blockEnd token ({{/if}} or {{/each}}), so parsing resumes after the block.
- Return the correct AST node depending on `block`:
    - `IfStatement` with `test` and `body`.
    - `EachStatement` with source and `body`.
- It treats `blockEnd` as a stop signal rather than producing a node in the AST (block ends don't need to appear in AST).
- Using `while` + `walk()` naturally builds nested structures: inner blocks are parsed recursively into their own AST nodes.
- The parser enforces that the block start and block end have matching `block` names, because it only stops at a `blockEnd` with the same `block` value.

```js
 const ast = {
    type: "Program",
    body: [],
  };

  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;
```
- The parser builds a top-level `Program` node whose `body` is an array of top-level child nodes.
- The `while` loop repeatedly calls `walk()` until all tokens are consumed.
- The returned AST is a tree rooted at `Program`.
Why a `Program` node?
- Standard practice: a single root node makes the output easy to work with for code generation or interpretation.
- Provides a predictable entry point for the compiler/renderer.

3. `compile(ast)` Function:
```js
function compile(ast){
    ...
}
```
- Inside the `compile` function, there are several helper functions such as:
    - `lookup(scope, path)`: used to find a variable inside the current scope or its parent scopes.
    - `evalTest(scope, test)`: use to evaluate `if` expressions.
    - `renderNode(node, scope)`: used to render each AST node into final HTML/text.
    - `render(data = {})`: the main function returned by `compile`, which takes user data and produces the final rendered template.

4. `lookup(scope, path)` Function:
```js
 function lookup(scope, path) {
    if (!path) return undefined;
    const parts = path.split(".");
    ...
 }
```
- `if (!path) return undefined;`: If caller asks to resolve nothing (empty string, null, etc.), bail out early with `undefined`.
- `parts = path.split(".")`: Break `"user.name.first"` into `["user","name","first"]` so we can traverse property-by-property.

```js
let curScope = scope;
while(curScope){
    ...
}
```
- Start at the provided `scope`. The while loop will walk up the chain via `curScope = curScope.__parent` at the end (see below). This implements lexical scoping: a lookup first checks local variables, then parent scope, and so on.

```js
if (parts[0] in curScope) {
        let val = curScope[parts[0]];
        for (let i = 1; i < parts.length; i++) {
          if (val === null) return undefined;
          val = val[parts[i]];
        }
        return val;
      }
```
- `if (parts[0] in curScope)`: Checks whether the first name exists on curScope (this includes properties inherited from the prototype chain). If it exists, we treat curScope[parts[0]] as the root to follow.
- Traverse remaining parts: If there are more parts (`user.name.first`), the `for` loop walks the object graph: `val = val[parts[i]]` for each subsequent segment. 
- `if (val === null) return undefined;`: If at any step the `val` is exactly `null`, we bail out returning `undefined`. (Note: this code checks only `null`, not `undefined`.)
- `return val`: If traversal succeeded, return the found value (could be `0`, `false`, `""`, an object, array, etc.).
Why this branch exists: It allows accessing variables defined directly on the current scope object (for example top-level data like `title`, or local variables created on that scope).

```js
if (
        curScope.this !== null &&
        typeof curScope.this === "object" &&
        parts[0] in curScope.this
      ) {
        let val = curScope.this[parts[0]];
        for (let i = 1; i < parts.length; i++) {
          if (val === null) return undefined;
          val = val[parts[i]];
        }
        return val;
      }
```
- Special handling for `this`: If `curScope.this` exists and is an object, and the first path segment exists on `curScope.this`, then resolve the path starting from `this`. This is how `{{this}}` or `{{this.name}}` inside an `#each` loop resolves to the current loop item.
- It repeats the same traversal logic as the previous branch and returns the value if found.
Why this branch exists: inside loops you often refer to properties of the current item with `{{this}}` or `{{this.prop}}`. This branch makes those bindings work even if the item’s properties aren’t present on the outer scope.

```js
curScope = curScope.__parent;
return undefined;
```
- Move up the scope chain to the parent and reapeat. If no scope provides the property, return `undefined`
This implements fallback lookup so inner scopes can access values from outer scopes.

5. `evalTest(scope, test)` Function:
```js
function evalTest(scope, test) {
    const value = lookup(scope, test);
    return !!value;
  }
```
- `const value = lookup(scope, test);`:
    - What it does: Calls your `lookup` function to resolve the identifier/expression `test` (e.g. `"isLogged"`, `"user.active"`, `"this.length"`) against the current `scope` chain.
    - Why: The `if` block needs to know the value of the variable referenced by test. `lookup` returns that value (could be `true`, `0`, `"hello"`, an object, `undefined`, etc.).
- `return !!value;`
    - What it does: Coerces `value` to a boolean by using double negation: first !value produces a boolean `true/false`, then `!` again flips it, so `!!value` is the boolean equivalent of `value`.
    - Why: `if` conditions in templates typically test truthiness, not strict equality. `!!value` gives you a simple truthy/falsy decision for the `if`. For example:
       - `value = "abc"` → `!!value` → `true` (non-empty string is truthy)
       - `value = 0` → `!!value `→ `false` (0 is falsy)
       - `value = null` / `undefined` → `!!value` → `false`
- The comments list what JS considers falsy/truthy:
    Falsy: `0`, `null`, `undefined`, `NaN`, `false`, `""` (empty string)
    Truthy: everything else (non-empty strings, objects, arrays, functions, true, non-zero numbers, etc.)

6. `renderNOde(node, scope)` Function:
```js
function renderNode(node, scope) {
    switch (node.type) {
      case "Text":
        return node.value;
      case "Variable": {
        // variables names can be dotted paths like "user.name" or "this" or "this.name"
        const val = lookup(scope, node.name);

        // convert undefined/null to empty string
        return val === undefined ? "" : String(val);
      }

      case "IfStatement": {
        if (evalTest(scope, node.test)) {
          return node.body.map((n) => renderNode(n, scope)).join("");
        } else {
          return ""; // no else support yet; you can extend AST to have alternate[]
        }
      }

      case "EachStatement": {
        const iterable = lookup(scope, node.source);
        if (!iterable || !Array.isArray(iterable)) return "";
        let out = "";
        for (let i = 0; i < iterable.length; i++) {
          const item = iterable[i];
          // create child scope: item available as `this`. keep parent pointer for lookup.
          const childScope = {
            __parent: scope,
            this: item,
            index: i,
          };
          out += node.body.map((n) => renderNode(n, childScope)).join("");
        }
        return out;
      }

      default:
        throw new Error("Unknown AST node type: " + node.type);
    }
  }
```
- The renderer behaves differently depending on what kind of AST node it is:
    - Text node
    - Variable node
    - If block
    - Each block
    - Unknown node
- `CASE 1: Text Node`: It directly returns the plain text content found in the template. Because plain text should appear in the final output unchanged.
- `CASE 2: Variable Node`: 
    - Gets the variable value using `lookup(scope, node.name)`.
        - Supports paths like `"user.name"`
        - Supports `"this"` inside loops
    - Converts undefined to empty string (standard template behavior)
    - Converts everything else to a string
- When template has `{{user.name}}`, we need to replace this with the actual value.
Template engines never print "undefined" or "null", so you replace them with empty string.
- `CASE 3: IfStatement`: 
    - Calls `evalTest` to check if the `test` is truthy.
    - If true → render all children inside that block.
    - If false → return empty string.
- `CASE 4: EachStatement`: 
    - Looks up the array to loop over.
    - If it's not an array, returns empty (invalid each).
    - For each item:
        - Creates a child scope: `{ __parent: scope, this: item, index: i}`.
        - Renders block contents using this new scope.
    - Joins everything into final output.
- `DEFAULT CASE`: If add a new AST type but forgets to handle it in `renderNode`, this error shows.
Why do we use `renderNode`:
The template engine works in three phases:
- `tokenize()`: turns template string into tokens.
- `parse()`: turns tokens into AST.
- `renderNode()`: turns AST into output.

7. `render(data = {})` Function:
```js
return function render(data = {}) {
    const rootScope = Object.create(null);
    Object.assign(rootScope, data);
    rootScope.__parent = null;
    const program = ast;
    if (!program || program.type !== "Program") {
      throw new Error("Expected Program AST");
    }

    return program.body.map((n) => renderNode(n, rootScope)).join("");
  };
```
- Returns a function named `render` that accepts one argument `data`.
- The compiler produces a reusable renderer for the compiled template. `data` is the context/model used to fill template variables. The default `= {}` ensures `render()` can be called with no args 
- `Object.create(null)`: creates a plain object without a prototype (`__proto__ === undefined`).
    - It prevents accidental property collisions with built-in prototype properties (like `toString`). It makes `in` or `hasOwnProperty` checks more predictable for scope lookup.
- `Object.assign(rootScope, data)`: shallow copies enumerable own properties from `data` onto `rootScope`.
    - We want the template to read `{{title}}` as `rootScope.title`. Copying into a fresh object avoids mutating the original `data` object, while keeping lookups fast.
- `rootScope.__parent = null`: sets the parent pointer for the scope chain.
    - Your lookup function walks `__parent` to allow nested child scopes (create in `#each`) to fallback to the root. `null` marks the top of the chain.
- A quick sanity check that the compiled input is a valid AST `Program`.
    - Defensive programming, if compile produced a wrong AST or you accidentally passed something else, this throws a clear error instead of failing later with obscure messages.
- `program.body.map((n)=> renderNode(n, rootScope))`:
    - For each top-level AST node, call `renderNode(node, rootScope)` to produce a string for that node.
    - `renderNode` is the function that converts AST nodes (Text, Variable, If, Each, ...) into string. Passing `rootScope` makes the root data available to all nodes.
- `.join("")`: 
    - Concatenates the array of rendered node strings into a single final string.
    - Joining is faster and cleaner than incremental string concatenation in a loop.
- Result: the `render(data)` call returns the fully rendered template string built from the AST and the provided data.
