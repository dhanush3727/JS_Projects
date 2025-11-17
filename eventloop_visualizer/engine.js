import {
  updateStack,
  updateMacrotaskQueue,
  updateMicrotaskQueue,
  updateWebAPI,
  logOutput,
} from "./ui.js";

const stack = [];
const webAPI = [];
const microtaskQueue = [];
const macrotaskQueue = [];

// Stack add & remove
export function pushToStack(item) {
  stack.push(item);
  updateStack(stack);
}
export function popFromStack() {
  stack.pop();
  updateStack(stack);
}

// WebAPI add & remove
export function addToWebApi(item) {
  webAPI.push(item);
  updateWebAPI(webAPI);
}
export function removeFromWebApi(item) {
  const index = webAPI.indexOf(item);
  if (index !== -1) {
    webAPI.splice(index, 1);
  }
  updateWebAPI(webAPI);
}

// Microtask add & remove
export function addToMicrotaskQueue(item) {
  microtaskQueue.push(item);
  updateMicrotaskQueue(microtaskQueue);
}
export function removeFromMicrotaskQueue() {
  const item = microtaskQueue.shift();
  updateMicrotaskQueue(microtaskQueue);
  return item;
}

// Macrotask add & remove
export function addToMacrotaskQueue(item) {
  macrotaskQueue.push(item);
  updateMacrotaskQueue(macrotaskQueue);
}
export function removeFromMacrotaskQueue() {
  const item = macrotaskQueue.shift();
  updateMacrotaskQueue(macrotaskQueue);
  return item;
}

// Mock async api
export function simulateTimeout() {
  addToWebApi({
    type: "timeout",
    name: "setTimeout callBack",
    doneAt: Date.now() + 1000,
  });
}
export function simulatePromise() {
  addToWebApi({
    type: "promise",
    name: "Promise.then",
    doneAt: Date.now() + 500,
  });
}

// Event Loop
let loopInterval = null;

function eventLoopTick() {
  // Stack
  if (stack.length > 0) {
    const current = stack[stack.length - 1];
    logOutput(`Executed : ${current}`)
    popFromStack();
    return;
  }

  // Microtask queue
  if (microtaskQueue.length > 0) {
    const task = removeFromMicrotaskQueue();
    pushToStack(task);

    setTimeout(() => {
      popFromStack();
    }, 200);

    return;
  }

  // Macrotask
  if (macrotaskQueue.length > 0) {
    const task = removeFromMacrotaskQueue();
    pushToStack(task);

    setTimeout(() => {
      popFromStack();
    }, 250);
  }

  // Web API
  for (const api of [...webAPI]) {
    if (api.doneAt <= Date.now()) {
      if (api.type === "timeout") {
        addToMacrotaskQueue(api.name);
      }

      if (api.type === "promise") {
        addToMicrotaskQueue(api.name);
      }

      removeFromWebApi(api);
    }
  }
}

export function startEventLoop() {
  if (loopInterval) return;

  loopInterval = setInterval(eventLoopTick, 200);
  console.log("Event Loop started");
}
