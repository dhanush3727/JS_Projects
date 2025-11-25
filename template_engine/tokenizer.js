// Function to change the HTML template to tokens
function tokenize(template) {
  const tokens = [];
  const len = template.length;
  let cursor = 0;

  const throwError = (msg, pos = cursor) => {
    const error = new SyntaxError(`${msg} at position ${pos}`);
    error.position = pos;
    throw error;
  };

  while (cursor < len) {
    const open = template.indexOf("{{", cursor); //second one is startIndex that set default 0.
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

    if (open > cursor) {
      tokens.push({
        type: "text",
        value: template.slice(cursor, open),
        start: cursor,
        end: open,
      });
    }

    // Check triple-stash {{{...}}}
    let close;
    // startsWith - a string begins with the character of a specified string, return true or false
    // the second one is startIndex default is 0.
    if (template.startsWith("{{{", open)) {
      close = template.indexOf("}}}", open + 3); // why +3 because we starts with {{{ so we want to skip
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

    // Normal double-stash
    close = template.indexOf("}}", open + 2);
    if (close === -1) throwError("Unclosed tag", open);
    const inner = template.slice(open + 2, close).trim();

    // Classify
    if (inner.length === 0) {
      // empty tag - treat as text or error
      tokens.push({
        type: "text",
        value: "{{}}",
        start: open,
        end: close + 2,
      });
      cursor = close + 2;
      continue;
    }

    // Block start (#if, #each)
    if (inner[0] === "#") {
      // split the directive from expression: "#if isLogged"
      const rest = inner.slice(1).trim();
      const [blockName, ...exprParts] = rest.split(/\s+/); // Split by one or more spaces
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

    // Block end (/if, /each)
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

    // Partial include: {{> header}}
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

    // Helper call or variable (we'll assume variable for now)
    // We can detect helpers by (identifier + space + args)
    const spaceIndex = inner.indexOf(" ");
    if (spaceIndex > -1) {
      // treat as helper
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
      // simple variable path like "user.name" or "this"
      tokens.push({
        type: "variable",
        value: inner,
        raw: inner,
        start: open,
        end: close + 2,
      });
    }

    cursor = close + 2;
  }

  return tokens;
}

// Change the tokens to AST
function parse(tokens) {
  let current = 0;

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

  const ast = {
    type: "Program",
    body: [],
  };

  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;
}

// compile AST
function compile(ast) {
  // helper: lookup a dotted path using a scope chain
  function lookup(scope, path) {
    if (!path) return undefined;
    const parts = path.split(".");

    // Try to resolve starting at current scope and walking up parents.
    let curScope = scope;
    while (curScope) {
      // If first part exists as a direct property on curScope, traverse from there
      if (parts[0] in curScope) {
        let val = curScope[parts[0]];
        for (let i = 1; i < parts.length; i++) {
          if (val === null) return undefined;
          val = val[parts[i]];
        }
        return val;
      }

      // Otherwise try to check if curScope.this is an object and matches first part
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
      curScope = curScope.__parent;
    }
    return undefined;
  }

  // Evaluate a "test" expression. Ex: "isLogged"
  function evalTest(scope, test) {
    const value = lookup(scope, test);
    return !!value; //check the truthy or falsy
    // falsy values - 0, null, undefined, NaN, false, empty string
    // truthy values - Everything without falsy values
  }

  // Render a single node with the given scope
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

  // Return the render function which sets up the initial scope and walks the Program
  return function render(data = {}) {
    // Initial scope: properties of data accessible directly, plus parent null
    // We don't copy all properties to avoid mutation: but making a shallow wrapper is simpler
    const rootScope = Object.create(null);
    Object.assign(rootScope, data);
    rootScope.__parent = null;
    const program = ast;
    if (!program || program.type !== "Program") {
      throw new Error("Expected Program AST");
    }

    return program.body.map((n) => renderNode(n, rootScope)).join("");
  };
}

const template = `
<h1>{{title}}</h1>
{{#if isLogged}}
Welcome, {{user.name}}
{{/if}}

<ul>
{{#each users}}
  <li>{{this}}</li>
{{/each}}
</ul>
`;
const tokens = tokenize(template);
console.log("Token: ", tokens);

const ast = parse(tokens);
console.log("AST:", JSON.stringify(ast, null, 2));

const render = compile(ast);

const output = render({
  title: "Site",
  isLogged: true,
  user: { name: "Dhanush" },
  users: ["Alice", "Bob"],
});

console.log("OUTPUT:\n", output);
