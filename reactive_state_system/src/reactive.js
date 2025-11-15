import {track, trigger} from "./effect.js"

// Create reactive() using Proxy
export function reactive(target) {
  return new Proxy(target, {
    get(obj, key) {
      const value = obj[key];
      // console.log(`%c GET ${key}: ${value}`, "color : gray");

      track(obj, key);
      return value;
    },

    set(obj, key, value) {
      // console.log(`%c SET ${key}: ${value}`, "color:purple");

      obj[key] = value;
      trigger(obj, key);
      return true;
    },
  });
}
