// import the effect and activeEffect from effect.js
import { activeEffect, effect } from "./effect.js";

// Create automactically updated and cached ractive values based on other reactive sources
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
