
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
  })({0: [
    function(require, module, exports){
    "use strict";

var _add = require("./add.js");
var _multiple = require("./multiple.js");
console.log("hello");
console.log((0, _add.add)(1, 2));
console.log((0, _multiple.multiple)(1, 2));
    },
    {"./add.js":1,"./multiple.js":2}
    ],
    1: [
    function(require, module, exports){
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
var _sub = require("./sub.js");
function add(a, b) {
  return "Add: ".concat(a + b);
}
console.log((0, _sub.sub)(1, 2));
    },
    {"./sub.js":3}
    ],
    2: [
    function(require, module, exports){
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.multiple = multiple;
var _divide = require("./divide.js");
function multiple(a, b) {
  return "Multiple: ".concat(a * b);
}
console.log((0, _divide.divide)(8, 2));
    },
    {"./divide.js":4}
    ],
    3: [
    function(require, module, exports){
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sub = sub;
function sub(a, b) {
  return "Sub: ".concat(a - b);
}
    },
    {}
    ],
    4: [
    function(require, module, exports){
    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.divide = divide;
function divide(a, b) {
  return "Divide: ".concat(a / b);
}
    },
    {}
    ],
    })
  