// Global variable to store the active effect function
export let activeEffect = null;

// A dependency map (target -> key -> set of effects)
const targetMap = new WeakMap();

// each effect keeps a list of its deps
function cleanup(effectfn) {
  effectfn.deps.forEach((dep) => dep.delete(effectfn));
  effectfn.deps.length = 0;
}

// The old effect() function registers a reactive function
// export function effect(fn) {
//   // console.log("%c effect() called", "color: green");
//   activeEffect = fn;

//   fn(); // run once to track dependencies

//   activeEffect = null;
// }

export function effect(fn, options = {}) {
  const effectfn = () => {
    cleanup(effectfn); // remove old deps before re-tracking
    activeEffect = effectfn;
    const result = fn();
    activeEffect = null;
    return result;
  };

  // store options (like scheduler)
  effectfn.options = options;
  effectfn.deps = [];

  // Run immediately unless lazy (used for computed)
  if (!options.lazy) {
    effectfn();
  }

  // return a runner function so we can stop later
  const runner = effectfn;
  runner.stop = () => {
    cleanup(effectfn);
    effectfn.options.stopped = true;
  };

  return runner;
}

// Track dependencies
export function track(target, key) {
  if (!activeEffect) return;

  // console.log(
  //   `%c Tracking dependency: target = ${target.constructor.name}, key=${key}`,
  //   "color:blue"
  // );

  let depsMap = targetMap.get(target);

  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);

  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
  // console.log("Active effect saved for this key");
}

// Trigger effects when data changes
export function trigger(target, key) {
  // console.log(`%c Trigger called for key: ${key}`, "color : orange");

  const depsMap = targetMap.get(target);

  if (!depsMap) return;

  const dep = depsMap.get(key);

  if (dep) {
    // console.log(`Found ${dep.size} effect(s), re-running them...`);

    dep.forEach((effectfn) => {
      if (effectfn.options.stopped) return; // skip stopped effects
      if (effectfn.options.scheduler) {
        effectfn.options.scheduler(effectfn);
      } else {
        effectfn();
      }
    });
  }
}
