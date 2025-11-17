## Custom Event Loop Visualizer
This project is a visual simulation tool that shows how javascript executes code internally. In this project, build an interaction UI that animates:
- Call Stack
- Web API's
- Microtask queue
- Macrotask queue
- Event loop cycles

# Goal
To visually demonstrate what happens behind the scenes when you run:
- normal function
- setTimeout
- Promises
- async/await
- fetch
- event listeners

# Code Explanation
```javascript
function animateAppend(parent, element) {
  element.classList.add("fade-slide");
  parent.appendChild(element);

  // Smooth enter
  requestAnimationFrame(() => {
    element.classList.add("show");
  });
}
```
1. `element.classList.add("fade-slide")`:
   - Adds the base animation class which defines the initial state for the element.
   - This ensures the element is created in its hidden/starting state.
2. `parent.appendChild(element)`:
   - Inserts the element into the DOM under the given `parent` container. At this moment the element is in the starting state.
3. `requestAnimationFrame(()=>{element.classList.add("show")})`:
   - Schedule the callback to run on the next paint. Adding the .`show` class after the element has been inserted forces the browser to see a state change from the initial styles to the final styles defined by `.fade-slide.show`.
   - Using `requestAnimationFrame` is important, if you add `.show` immediately before the browser has a chance to paint the element in its starting state, the transition may not run.

```javascript
export function updateStack(list) {
  stack.innerHTML = "";

  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "stack-item fade-slide";
    div.textContent = item;

    animateAppend(stack, div);
  });
}
```
1. `stack.innerHTML = ""`:
   - Clears the previous DOM nodes inside the stack container so the UI will be rebuilt from the current `list`. This keeps the UI synchronized with state.
2. `list.forEach((item) => { ... })`:
   - Loop over each item in the provided `list` (your internal `stack` array).
3. `const div = document.createElement("div")`:
   - Create a new DOM element to represent one stack frame.
4. `div.className = "stack-item fade-slide"`:
   - Adds element classes. `stack-item` is layout/style `fade-slide` is the base animation class.
5. `div.textContent = item`:
   - Sets visible text. `item` is expected to be a string like `"Sync Function"`.
6. `animateAppend(stack, div)`:
   - Add the element to the DOM and trigger its enter animation.

```javascript
export function logOutput(message) {
  const text = document.createElement("div");
  text.className = "log-line";
  text.textContent = message;

  outputContent.appendChild(text);

  requestAnimationFrame(() => {
    text.classList.add("show");
  });

  // Auto-scroll
  outputContent.scrollTop = outputContent.scrollHeight;
}
```
1. `const text = document.createElement("div")`: create a new log line element.
2. `text.className = "log-line"`: base style for logs (likely hidden/offset initially in CSS).
3. `text.textContent = message`: set the log message.
4. `outputContent.appendChild(text)`: add the line to the log container (at the bottom).
5. `requestAnimationFrame(() => { text.classList.add("show"); })`: same enter animation technique as animateAppend, causing the line to fade/slide in smoothly.
6. `outputContent.scrollTop = outputContent.scrollHeight`: keep the log scrolled to the bottom so the newest message is visible.
Why `requestAnimationFrame`?
`requestAnimationFrame` schedules code right before the browser’s next paint. Adding the `.show` class inside it guarantees the browser painted the element in its initial state first — so the CSS transition animates from initial → final. Without it, the browser may skip the intermediate state and the transition won’t run.

```javascript
import {
  updateStack,
  updateMacrotaskQueue,
  updateMicrotaskQueue,
  updateWebAPI,
  logOutput,
} from "./ui.js";
```
- Import the necessary functions from `ui.js` file.

```javascript
const stack = [];
const webAPI = [];
const microtaskQueue = [];
const macrotaskQueue = [];
```
- stack: Call Stack(sync execution).
- webAPI: Browser API's(Timers, fetch, promise resolve, events).
- microtaskQueue: Promise jobs.
- macrotaskQueue: setTimeout, events, fetch callbacks.

```javascript
export function pushToStack(item) {
  stack.push(item);
  updateStack(stack);
}
export function popFromStack() {
  stack.pop();
  updateStack(stack);
}
```
- Stack Operations:
  1.  Adding something to call stack:
      - Simulates pushing a function into the stack.
      - Updates UI.
  2.  Removing something from stack:
      - Remove the element from stack.

```javascript
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
```
- WebAPI operations:
  - This simulates setTimeout waiting.
  - fetch waiting.
  - promise resolve pending.

```javascript
export function addToMicrotaskQueue(item) {
  microtaskQueue.push(item);
  updateMicrotaskQueue(microtaskQueue);
}
export function removeFromMicrotaskQueue() {
  const item = microtaskQueue.shift();
  updateMicrotaskQueue(microtaskQueue);
  return item;
}
```
- Microtask operations:
  - Add microtask: Add the microtask related element ex: Promise.then
  - Remove microtask: Use `shift()` because this is queue so run FIFO.

```javascript
export function addToMacrotaskQueue(item) {
  macrotaskQueue.push(item);
  updateMacrotaskQueue(macrotaskQueue);
}
export function removeFromMacrotaskQueue() {
  const item = macrotaskQueue.shift();
  updateMacrotaskQueue(macrotaskQueue);
  return item;
}
```
- Macrotask operations:
  - Add macrotask: Add the macrotask related element ex: event listeners.
  - Remove macrotask: Use `shift()` because this is queue so run FIFO.

```javascript
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
```
1. Set Time out simulation:
   - Goes to WebAPI.
   - After 1000ms -> goes to Macrotask queue.
2. Promise simulation:
   - Goes to WebAPI.
   - After 500ms -> goes to Microtask queue.

```javascript
let loopInterval = null;

function eventLoopTick() {
  // Handle Stack
  if (stack.length > 0) {
    const current = stack[stack.length - 1];
    logOutput(`Executed : ${current}`);
    popFromStack();
    return;
  }

  //Handle Microtask queue
  if (microtaskQueue.length > 0) {
    const task = removeFromMicrotaskQueue();
    pushToStack(task);

    setTimeout(() => {
      popFromStack();
    }, 200);

    return;
  }

  //Handle Macrotask
  if (macrotaskQueue.length > 0) {
    const task = removeFromMacrotaskQueue();
    pushToStack(task);

    setTimeout(() => {
      popFromStack();
    }, 250);
  }

  //Handle Web API
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
```
1. Handle Stack:
   - If stack has a task -> execute it.
   - Log it.
   - Remove it.
   - Event loop tick stosps here(return).
2. Handle Microtasks:
   - Microtask always run before macrotasks.
   - If microtask has a task it push to stack.
   - after 200ms it remove from microtask queue.
3. Handle Macrotasks:
   - Same as microtask queue.
   - If macrotask has a task it push to stack.
   - after 250ms ir remove from macrotask queue.
4. Handle WebAPI:
   - checks that the times finished, if yes move it to the correct queue.
   - If timeout -> macrotask.
   - If promise -> microtask.
   - Remove from WebAPI table.

```javascript
export function startEventLoop() {
  if (loopInterval) return;

  loopInterval = setInterval(eventLoopTick, 200);
  console.log("Event Loop started");
}
```
- This is help to start the `eventLoopTick` function every 200ms.

```javascript
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
```
- Import the necessary function from `engine.js` file
- `startEventLoop()`: It starts the event loop cycle
- When click the button `run-sync`:
  - `"Sync code"` is pushed directly into the Call Stack.
  - There is no Web API, no queue, no delay.
  - Represents normal Javascript.
- `run-timeout`:
  - It simulate the `simulateTimeout` function.
  - Inside this function, a web api entry is created.
  - That is goes to Web API(Timer zone).
  - After 1000ms -> it moves to Macrotask Queue.
  - Event Loop eventually picks it -> goes to call stack.
- `run-promise`:
  - It simulate the `simulatePromise` function.
  - Added to Web API Promise area with.
  - After 500ms -> moved to Microtask Queue.
  - Event loop processes microtasks before macrotasks
  - Then callback enters the Call Stack.
- `run-event`:
  - Browser puts event callback in the Macrotask Queue.
  - A user event occurred.
  - It goes straight to Macrotask Queue.
  - Event loop picks it.
  - Runs the handler on the call stack.
