import {
  pushToStack,
  startEventLoop,
  simulatePromise,
  simulateTimeout,
  addToMacrotaskQueue,
} from "./engine.js";

startEventLoop();

document.getElementById("run-sync").addEventListener("click", () => {
  pushToStack("Sync code");
});

document.getElementById("run-timeout").addEventListener("click", () => {
  simulateTimeout();
});

document.getElementById("run-promise").addEventListener("click", () => {
  simulatePromise();
});

document.getElementById("run-event").addEventListener("click", () => {
  addToMacrotaskQueue("DOM Event Handler");
});
