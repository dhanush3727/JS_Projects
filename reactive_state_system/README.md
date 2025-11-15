## Reactive State System

In this project, to create a system where your UI automatically updates when data changes without manually updating the DOM.

# Concepts

In this project I'll use concepts like proxy pattern, observer pattern, dependency tracking and closures, before moving to the project understand the basics of this concepts

1. Proxy Pattern :
   The Proxy Pattern allows you to intercept and customize the behavior of fundamental operations (like reading, writing or deleting a property) on an object. In JS the `Proxy` object lets you wrap another object and control how it behaves.
2. Observer Pattern :
   The Observer pattern defines a one to many relatinoship between objects so that when one object changes, all its observers are notified and updated automatically.
3. Dependency Tracking :
   Dependency tracking means keeping a record of which functions depend on which data, so that only the necessary funcions re-run when data changes.
4. Closure :
   A Closure is when a function remembers variables from the scope where it was created, even after that scope has finished executing.

# Code Explanation

In this project I use `WeakMap`, `Map`, and `Set` Why?

- WeakMap : Because we use objects as keys. I we later stop using state, WeakMap allows it to be garbage-collected automatically.
- Map : Each target object can have many properties (count, name, etc). So we use a Map to store dependencies by property name.
- Set : Because one property may have multiple effects using it. A Set prevents duplicates and allows easy iteration.

```javascript
let activeEffect = null;
```

- This holds the currently running effect function.
- When you call `effect(()=>{...})`, that function becomes the active effect.
- While it runs, if any reactive property is accessed `state.count`, we record that this effect depends on that property.
- Right now I'm running this effect --- remember what data it reads.

```javascript
const targetMap = new WeakMap();
```

- This is where we store all dependency relationships.
  Structure:
  WeakMap(
  target (reactive object) → Map(
  key (property name) → Set(effects that depend on this key)
  )
  )
  Example:
  targetMap = {
  state: {
  count: [effect1, effect2]
  }
  }
- So we can quickly find which effects to re-run when a property changes.

```javascript
function effect(fn) {
  activeEffect = fn;
  fn();
  activeEffect = null;
}

effect(() => {
  console.log(state.count);
});
```

- `activeEffect` = the function that logs `state.count`.
- Inside that function, `state.count` is accessed, triggers `get()`, calls `track()`, remembers that `state.count` affects this function.
- `activeEffect` reset to null.

```javascript
function track(target, key) {
  if (!activeEffect) return;
  let despMap = targetMap.get(target);
  if (!despMap) {
    despMap = new Map();
    targetMap.set(target, despMap);
  }
  let dep = despMap.get(key);
  if (!dep) {
    dep = new Set();
    despMap.set(key, dep);
  }
  dep.add(activeEffect);
}
```

- If there's no `activeEffect`, skip(means we're not inside an effect).
- Get the map of dependencies for this object `target.get(target)`.
- If not exist, create one.
- Get the dependency set for this key like `count`.
- Add the `activeEffect` to that set.
- This effect depends on `state.count`. So next time `state.count` changes, we know which effect to re-run.

```javascript
function trigger(target, key) {
  const despMap = targetMap.get(target);
  if (!despMap) return;
  const dep = despMap.get(key);
  if (dep) {
    dep.forEach((effect) => {
      effect();
    });
  }
}
```

- This notifies all effects that depend on a changed property.
- Get all dependencies for this target.
- Run every effect in that set again.
- `state.count` changed -- re-run all effects that used it.
- So when we do `state.count++` triggers Proxy set() -> calls `trigger()` -> re-runs your UI update.

```javascript
function reactive(target) {
  return new Proxy(target, {
    get(obj, key) {
      const value = obj[key];
      track(obj, key);
      return value;
    },
    set(obj, key, value) {
      obj[key] = value;
      trigger(obj, key);
      return true;
    },
  });
}

// Example
const state = reactive({ count: 0 });
state.count; // when we read, triggers track()
state.count++; // when we write, triggers trigger()
```

- This creates a `Proxy` around your object to intercept `get` and `set` operations
- So the Proxy automatically tracks dependencies when you read, and triggers updates when you write.

```javascript
const state = reactive({ count: 0 });
```

- This is making a reactive version of our data. Any read/write to this object will go through the Proxy handlers above.

```javascript
effect(() => {
  countEl.textContent = `Count: ${state.count}`;
});
```

- This sets up a reaction
  - Runs immediately once (sets initial count).
  - While runnig, it access `state.count` -> `track()` saves dependency.
  - When `state.count` changes, trigger() re-runs this effect.
- So your DOM is always synced with the latest value automactically.

```javascript
btn.addEventListener("click", () => {
  state.count++;
});
```

- When you click the button.
- `state.count++` call Proxy `set()`.
- `trigger()` finds that `count` has one dependent effect.
- That effect re-runs -> updates DOM text -> UI reflects new count.

```javascript
// ref.js
import { activeEffect } from "./effect.js";

export function ref(initialValue) {
  const dep = new Set();

  return {
    get value() {
      if (activeEffect) dep.add(activeEffect);
      return initialValue;
    },
    set value(newValue) {
      initialValue = newValue;
      dep.forEach((effect) => effect());
    },
  };
}

const number = ref(0);
effect(() => {
  console.log("ref", number.value);
});

number.value++;
number.value = 42;
```

The purpose of `ref()`: Add the reactive wrapper for primitive values like number, string, etc

1. `const number = ref(0)`:

- `ref(0)` returns an object with a getter/setter pair for .value.
- Internally `initialValue = 0` and `dep = new Set()` is initially empty.
- `number` is now `{get value() {...}}, set value(newValue) {...}}`.
- No effect has been registered yet, so `dep` remains empty.

2. `effect(()=>{console.log("ref", number.value);})`:

- `effect` sets the module `activeEffect` to the `fn` function.
- `effect` calls `fn()` immediately.
- While `fn()` executes: It evaluates `number.value`. This triggers the getter.
- Inside the getter: `if(activeEffect) dep.add(activeEffect)` --- because `activeEffect` is set, the effect function is added to `dep`.
- Back in `effect`: After `fn()` finishes, `effect` clears `activeEffect = null`
- Result now: `dep` contains one function (the effect). Console printed: `ref 0`.

3. `number.value++`:

- Getter call: `number.value` read outside an `activeEffect` we cleared `activeEffect` earlier, so `activeEffect` is null, getter returns current value 0, but does not add anything to `dep` this time.
- Compute: 0+1 = 1;
- Setter call: `set value(newValue)` runs: `initialValue = 1` (the stored primitive is updated).
- `dep.forEach((effect)=>effect())`, we iterate the Set and call the stored effect funcions. That effect runs synchronously now.
- When the effect runs now: `effect` executes `console.log("ref", number.value)`.
- Inside that execution: `number.value` is read, getter runs. Since this read is happening while the effect is running, `activeEffect` must be set by the effect infrastructure. In your simple implementation `effect` set `activeEffect` before calling the function so the getter will add the same effect to `dep` again but `dep` is a `Set` so duplicates don't matter.
- The effect prints: `ref 1`
- After effect finishes, `activeEffect` is cleared.

4. `number.value = 42`:

- This directly calls the setter with `42`.
- Setter sets `initialValue = 42`.
- Then it iterates `dep.forEach((effect)=>effect())` and re-runs the stored effects.
- Effect reads `number.value`(getter), getter sees `activeEffect` present and re-adds it to `dep`(Set prevents duplicates), return `42`.
- Effect prints: `ref 42`.

```javascript
// computed.js
import { activeEffect, effect } from "./effect.js";

export function computed(getter) {
  let value; // Stores the computed value
  let dirty = true; // flag to know if recomputation is needed
  const dep = new Set(); // store effects that depend on this computed value

  //   track dependencies of getter manually
  let computedEffect = () => {
    value = getter(); // directly run getter
    dirty = false; // mark as clean
  };

  // Register reactivity for dependencies used inside getter
  effect(() => {
    // When dependencies (like ref or reactive) change,
    // we just mark this computed as dirty, not recompute immediately
    dirty = true;

    // Notify other effects that depend on this computed value
    dep.forEach((effect) => effect());
  });

  return {
    get value() {
      if (activeEffect) dep.add(activeEffect); // track dependency
      if (dirty) {
        // recomupte only when dirty
        computedEffect();
      }
      return value;
    },
  };
}
```

The purpose of `computed()` is to create automatically updated and cached reactive values based on other reactive sources.

- `computed(getter)` takes a getter function (like `()=>number.value * 2`).
- It creates a lazy effect that doesn't run immediately -- it runs only when needed.
- It uses a `dirty` flag to cache the computed value:
  - If `dirty = true`, recompute it.
  - If `dirty = false`, return the cached value.
- When any reactive dependency (like `number.value`) changes:
  - The scheduler sets `dirty = true`.
  - Any effects using the computed value are notified to re-run.
- The next time `.value` is accessed, it recomputes and caches again.

```javascript
// In effect.js update the effect function
function cleanup(effectfn) {
  effectfn.deps.forEach((dep) => dep.delete(effectfn));
  effectfn.deps.length = 0;
}

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
```

`cleanup()`:

- Every effect stores `effectfn.deps = []`.
- This array contains all `Set` that this effect is watching.
- Before re-running the effect, you must cleanup old dependencies.

Why cleanup:

- Because dependencies might change each run.
- If you don't cleanup, the effect will be there forever, causing wrong updates. So `cleanup()` removes the effect from every Set.

`effect()`:

- An effect is a function that reads reactive data & automatically re-runs when that data changes.
- It create a wrapped function `effectfn`, because we need to track dependencies, cleanup, manage activeEffect.
- Set options (scheduler, lazy): These allow custom behavior.
  Automatically run the effect (unless lazy), this is the initial tracking phase.
- Return a runner: So the user can manually run the effect OR stop it.
- runnder.stop(): removes all dependencies, marks the effect as stopped, prevents future automatic triggers.

`track()`:

- It runs inside the getter of your `reactive()` proxy.
- If no activeEffect nothing to track.
- Get the depsMap for the object.
- Get the Set for this key.
- Add the activeEffect to this Set.
- Add the Set to `effectfn.deps`.
- This effect depends on this property. When that property changes, re-run this effect.

`trigger()`:

- Called inside Proxy `set()` when a reactive value changes.
- Find all effects depending on this property.
- For each effect:
  - If `effect.stopped === true` -> skip.
  - If `scheduler` exists -> call scheduler
  - Else -> re-run the effect immediately
- Scheduler allows batching, debouncing, throttling, async updates, delayed UI updates.

```javascript
const runner = effect(
  () => {
    console.log("Count changed:", state.count);
    countEl.textContent = `Count: ${state.count}`;
  },
  {
    scheduler: (job) => {
      console.log("Scheduled (not run immediately)");
      setTimeout(job, 1000);
    },
  }
);

setTimeout(() => {
  console.log("Stopping effect");
  runner.stop();
  state.count++;
}, 3000);
```
- `effect()` creates `effectfn` (an interanal function wrapper).
- `effectfn.deps = []` and `effectfn.options = { scheduler: ... }`.
- Because `options.lazy` is not set, `effectfn` is executed immediately
- `cleanup(effectfn)` tuns (no deps yet).
- `activeEffect = effectfn`.
- The user function runs: It reads `state.count`. That goes through your `Proxy.get`, which calls `track(state, "count")`.
- `track` sees activeEffect is `effectfn`, so:
  - looks up or creates `depsMap` for state in `targetMap`,
  - gets/creates `dep` Set for key `"count"`,
  - adds `effectfn` to `dep`,
  - pushes dep into `effectfn.deps`.
- The user function logs and updates DOM to initial `count: 0`.
- `activeEffect` is set back to `null`.
- Result: immediately on load you will see `Count changed: 0` and DOM shows `Count: 0`. Internally `targetMap` contains `state -> Map {"count" -> Set {effectfn}}`.
- Note: because `effect()` returned `effectfn` as the runner, `runner` now references that function.
- When click the button - `state.count++`:
  - This does a `get` then `set` on the proxy; we care about the `set`
  - Proxy `set` updates the raw value and then calls `trigger(state, "count")`.
  - `trigger` finds the `dep` Set for `"count"`. It contains `effectfn`.
  - For each `effectfn` in `dep`:
    - `trigger` checks `effectfn.options.stopped` — it is `undefined`/false, so proceed.
    - `trigger` sees `effectfn.options.scheduler` exists, so it calls `effectfn.options.scheduler(effectfn)` instead of `effectfn()`.
  - So scheduler prints `"Scheduled (not run immediately)"`.
  - Then it schedules `job` (which is `effectfn`) to run after 1000 ms using `setTimeout`.
  - important: at this moment the effect function has not yet run — it will run once after ~1 second.
- If you click the button again within that 1 second:
  - `state.count++` triggers `trigger` again.
  - `trigger` again calls the scheduler, which logs `"Scheduled..."` and schedules another `setTimeout(effectfn, 1000)`.
  - You will now have multiple pending timeouts each calling `effectfn` after their own delay.
- When a scheduled timeout fires: 
  - When `setTimeout` executes it calls `effectfn()`:
    - `effectfn` starts by calling `cleanup(effectfn)`:
      - That removes `effectfn` from all `dep` Sets listed in `effectfn.deps` and clears `effectfn.deps`.
    - Then `activeEffect = effectfn`.
    - The user function runs:
      - It reads `state.count` (latest value), so `track(state, "count")` will add `effectfn` back into the appropriate `dep` and push that `dep` into `effectfn.deps`.
      - It logs `Count changed:` with the current value and updates the DOM text to the current value.
    - `activeEffect = null`.
  - So each scheduled run re-establishes dependencies (after cleaning) and updates the DOM to the most recent `state.count`.
- After 3 seconds the stop call runs. The `setTimeout` that runs after 3000ms executes.
- First: runner.stop(): 
  - The `stop` function does:
    - `cleanup(effectfn)` -- that removes `effectfn` from all `dep` Sets and clears `effectfn.deps`. So `targetMap` no longer contains `effectfn` in the `"count"` Set.
    - `effectfn.options.stopped = true` -- marks the effect as stopped.
- Second: `state.count++` executed immediately after stop:
  - Proxy `set` updates the value and calls `trigger(state, "count")`.
  - `trigger` looks up the `dep` Set for `"count"`. Because `cleanup` removed `effectfn` earlier, the `dep` Set either is empty or doesn't contain `effectfn`.
  - Even if somehow `effectfn` remained, `trigger` checks `effectfn.options.stopped` and would skip it.
  - So `scheduler` will not be called for this effect; no new scheduled runs will be created.
  - The internal `state.count` value increments, but the DOM will not be updated by this stopped effect anymore.