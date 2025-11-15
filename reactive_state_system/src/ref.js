// import the activeEffect from effect.js
import { activeEffect } from "./effect.js";

// Creates a reactive wrapper around a primitive value like number, string
export function ref(initialValue) {
  const dep = new Set(); // stores effects that depend on this ref

  //   Return an object with a getter and setter for .value
  return {
    get value() {
      //   console.log(`%c[ref] GET value ${initialValue}`, "color:blue");

      //   If an effect is running, register it as a dependency
      if (activeEffect) {
        dep.add(activeEffect);
        // console.log(
        //   `%c[ref] Effect registered. Total deps: ${dep.size}`,
        //   "color: gray;"
        // );
      }

      // Return the internal value stored in this ref
      return initialValue;
    },
    set value(newValue) {
      //   console.log(
      //     `%c[ref] SET value: ${initialValue} → ${newValue}`,
      //     "color: purple; font-weight: bold;"
      //   );

      // Update the internal stored value
      initialValue = newValue;

      //   console.log(
      //     `%c[ref] Triggering ${dep.size} dependent effect(s)...`,
      //     "color: orange;"
      //   );

      // Whenever the value changes, re-run all effects that depend on it
      dep.forEach((effect) => effect());
    },
  };
}
