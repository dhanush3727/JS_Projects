## Excalidraw clone

This project is a simplified clone of excalidraw, focused only on - Drawing - Undo - Redo

1. Command Pattern:
   The Command Pattern is a design pattern used to encapsulate actions as separate objects. Instead of directly perfoming an action. So it can helps to adds, deletes, moves or edits something on the canvas.

2. Stack:
   A stack is a data structure that follows LIFO (Last In First Out). In this project stack use for undo/redo.

3. Canvas API:
   The Canvas API is a browser feature that lets you draw anything using JavaScript. - shapes - lines - images - text - custom drawings
   Why Canvas API is useful in this project? - It allows you to render visual elemnts like shapes, lines, arrows, rectangles, etc. - Lets you re-render the full drawing efficiently after undo/redo. - Gives pixel - level control over what appears on screen.
   In our implementation - Every time the state changes, we clear the canvas. - Then we redraw all shapes from the current state snapshot.

4. State Snapshotting:
   State snapshotting means saving a copy of the entire current drawing state.
   Why do we do this?
   When performing undo/redo, we must restore the canvas to a previous state.
   so after each action: - We saved a snapshot of all shapes (position, size, color, type, etc.). - Undo restores the previous snapshot. - Redo restores the next snapshot.

# Code Explanation:

```js
class DrawCommand {
  constructor(points) {
    this.points = points;
  }

  execute(context) {
    if (this.points.length < 2) return;

    context.beginPath();
    context.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      context.lineTo(this.points[i].x, this.points[i].y);
    }

    context.stroke();
  }
}
```

1. `class DrawCommand{...}`: Declares a class. We use a class becuase each stroke is an object (a command) that holds data (the stroke points) and behavior (how to draw itself). This class use for permanent drawing.
2. `constructor(points)`: - Called when you create a new instance: `new DrawCommand(points)`. - `points` is expected to be an array like `[{x:10, y:20}, {x:12, y:22}...]`. - The constructor saves that array on the instance: `this.points = points`.
   Why: we need to strore the stroke's data so it can be replayed later (for rendering, undo/redo, saving).
3. `execute(context)`: - This method is the command's action: draw this stroke on the given canvas 2D context. - You pass the canvas drawing context (`context = canvas.getContext('2d')`) when calling it.
   Why: central API -- every command exposes `execute(context)` so the renderer can iterate through the history and call `command.execute(context)` for each command. This uniform interface enables a generic render loop.
4. `if(this.points.length < 2) return`:
   - If the stroke has less than two points it's essentially a single click (or noise) nothing to draw as a line.
   - This avoids errors and unnecessary drawing calls.
5. `context.beginPath();`:
   - Starts a fresh path on the canvas context so the stroke won't be connected to whatever path was previously stroked.
   - It is isolates paths. Without it, subsequent `lineTo()` calls might connect across multiple strokes.
6. `context.moveTo(this.points[0].x, this.points[0].y);`:
   - Places the drawing cursor at the first point of the stroke without drawing a line there.
7. `for (let i = 1; i < this.points.length; i++) {context.lineTo(...)}`:
   - Adds straight line segments from the previous cursor position to each subsequent point.
   - This converts the discrete sampled points into a visible continuous polyline.
8. `context.stroke();`: - Renders the path outline to the canvas using the current stroke style (`context.strokeStyle`, `context.lineWidth`, etc.).
   **NOTE: `stroke()` uses whatever context state (color, width, cap, join) is currently set.**

```js
let isDrawing = false;
let currentPoints = [];

let undoStack = [];
let redoStack = [];

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 60;

context.strokeStyle = "black";
context.lineWidth = 2;
context.lineCap = "round";
context.lineJoin = "round";
```

1. `let isDrawing = false`:
   - A boolean flag that tells the app whether the user is currently drawing.
   - Set to `true` on `mousedown` and set to `false` on `mouseup`.
   - Prevents drawing when the mouse moves but the button isn't pressed, avoids stray points.
   - Ex: If `isDrawing` is `false`, `mousemove` handler should return immediately.
2. `let currentPoints = [];`:
   - An array that collects `{x,y}` points for the stroke the user is currently making.
   - We store these points while the user moves the pointer, when the stroke finishes we create a `DrawCommand` from this array and push it to the history.
   - When starting a new stroke you should reset this - `currentPoints = []`.
   - Very long stroke can accumulate many points you can optionally downsample (skip very close points) to reduce memory and replay cost.
3. `let undoStack = []`:
   - The stack of completed commands (each command represents a finished stroke).
   - This is the source of truth for what should be drawn. `render()` iterates `undoStack` and calls `execute(context)` for each command to rebuild the canvas.
   - When user draws, push new command to `undoStack`, when user pressses Undo, `undoStack.pop()` and push that command to `redoStack`.
4. `let redoStack = [];`:
   - Stack that holds commands removed form `undoStack` by an undo operation.
   - Allows redo, when the user undoes then wants to redo, we pop from `redoStack` and push back to `undoStack`.
   - when a new action happens (user draws again) you must clear `redoStack` because the redo chain is broken.
5. `const canvas = document.getElementById("canvas");`:
   - Grabs the `<canvas id="canvas">` element from the DOM.
   - To use the Canvas API we need the DOM element to get a drawing context and to listen for mouse/touch events.
   - Ensure the element exists before running this code (put script at end of body or run on DOMContentLoaded).
6. `const context = cavnvas.getContext("2d");`:
   - Obtains the 2D drawing context(`CanvasRenderingContext2D`) which provides drawing methods (`beginPath`, `moveTo`, `lineTo`, `stroke`, etc).
   - This `context` is your "bruch" for painting on the canvas.
   - For high-DPI (Retina) support you might later wrap this with device pixel ratio scaling.
7. `canvas.width = window.innerWidth;`:
   - Sets the canvas element's internal pixel width to the window width.
   - Default canvas size is 300\*150. To make it fill the screen you must set the canvas `width` and `height` properties (not just CSS).
   - `canvas.width`/ `.height` are pixel size and clear the canvas when changed.
   - Handle `window.resize` to update canvas size (and re-render) or scale for devicePixelRatio.
8. `canvas.height = window.innerHeight - 60;`:
   - Sets the canvas internal pixel height to window height minus 60 pixels.
   - Ensures the canvas fits below your toolbar.
   - The `-60` is project specific, if toolbar changes size you must update this calculation.
   - Changing width/height after drawing clears the canvas, always call `render()` after resizing to redraw history.
9. `context.strokeStyle = "black";`:
   - Sets the color used for stroking paths (lines).
   - Chooses the default pen color; you can change this later per command if you want colored strokes.
10. `context.lineWidth = 2;`:
    - Sets how thick the drawn lines are (in pixels).
    - Gives a default brush size. You can expose a UI control to change this.
    - For crisp lines on high-DPI screens scale lineWidth by `devicePixelRatio` if you scale the canvas.
11. `context.lineCap = "round";`:
    - Defines how the endpoints of lines are drawn. Options: `"butt"`, `"round"`, `"square"`.
    - `"round"`, makes endpoints rounded which produces smooth, natural strokes (like a marker or pen).
    - Ex: With `"butt"` the ends are square and can look sharp; `"round"` avoids sharp pixel tips.
12. `context.lineJoin = "round";`:
    - Defines how two line segments are joined together at their intersection. Options: `"bevel"`, `"round"`, `"miter"`.
    - `"round"`, gives smooth rounded corners between segments of a polyline, prevents sharp miter points when the stroke changes direction quickly.
    - Quick zig-zag without `lineJoin = "round"` may show ugly spikes at joints.

```js
function getMousePosition(e) {
  return {
    x: e.clientX - canvas.offsetLeft,
    y: e.clientY - canvas.offsetTop,
  };
}
```

1. `function getMousePosition(e)`:
   - Declares a function that accepts one argument `e`, which is the pointer event object you receive in mouse handlers (`mousemove`, `mousedown`, etc).
   - This `e` contains information about where the pointer is on the screen.
2. `e.clientX` and `e.clientY`:
   - `clientX` is horizontal coordinate of the pointer relative to the viewport (the visible browser window), in CSS pixels.
   - `clientY` is vertical coordinate relative to the viewport.
   - Ex: If the pointer is 150px from the left edge of the visible window, `clientX` is `150`.
3. `canvas.offsetLeft` and `canvas.offsetTop`:
   - `canvas.offsetLeft` is the distance from the left edge of the canvas offset parent to the left edge of its offset parent container commonly used to get the element's position relative to the document layout.
   - `canvas.offsetTop` is likewise for the top position.
   - These are approximations of where the canvas sits in the page.
4. `x: e.clientX - canvas.offsetLeft`:
   - Subtracts the canva's left position from the pointer's viewport X position to compute the pointer's X coordinate inside the canvas.
   - Intuition: How far from the left edge of the canvas is the pointer?
5. `y: e.clientY - canvas.offsetTop`:
   - Same for Y: pointer's distance from the top edge of the canvas.
6. The funtion returns an object `{x,y}`, which you then use as canvas-local coordinates for drawing.

```js
function drawLine(context, points) {
  if (points.length < 2) return;

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, points[i].y);
  }

  context.stroke();
}
```
1. `if (points.length < 2) return;`: 
    - Guard clause: if there are fewer than two sample points the function exits immediately because a line requires at least two points (prevents unnecessary work or tiny glitches).
2. `context.beginPath();`:
    - Starts a brand-new path on the canvas so the stroke you draw here won’t be connected to any previous path. Think of it as “lift and reset” before starting this stroke.
3. `context.moveTo(points[0].x, points[0].y);`:
    - Moves the drawing cursor to the first point in the stroke without drawing. This sets the starting position for the new stroke (equivalent to placing the pen on paper at the start point).
4. `for (let i = 1; i < points.length; i++) { ... }`:
    - Loops through each subsequent point collected while the user drew. The loop builds the shape of the stroke by connecting points in order.
5. `context.lineTo(points[i].x, points[i].y);`:
    - Adds a straight segment from the current cursor position to the next point. Repeating this for every point creates a polyline that follows the pointer path.
6. `context.stroke();`:
    - Renders the path outline to the canvas using the current `context` styles (color, width, caps, joins). This is the actual drawing operation that makes the path visible.

```js
function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const command of undoStack) {
    command.execute(context);
  }
}
```
1. `context.clearRect(0, 0, canvas.width, canvas.height);`:
    - This wipes the entire canvas clean.
    - We must clear everything first because when undo/redo happens, you redraw from scratch.
    - Without clearing, old drawings would overlap.
2. `for (const command of undoStack) { ... }`:
    - The `undoStack` contains all the DrawCommand objects representing every completed stroke.
    - We iterate through them one by one in the same order they were drawn.
3. `command.execute(context);`:
    - Every DrawCommand knows how to draw itself.
    - Calling `execute()` redraws that stroke on the canvas.
    - After the loop finishes, the entire drawing is reconstructed.

```js
function undo() {
  if (undoStack.length === 0) return;

  const command = undoStack.pop();
  redoStack.push(command);

  render();
}

function redo() {
  if (redoStack.length === 0) return;

  const command = redoStack.pop();
  undoStack.push(command);

  render();
}
```
`undo()` function:
1. Check if `undoStack` is empty: If there are no strokes, undo does nothing.
2. Remove last drawn command:
    - `.pop()` removes the most recent draw action.
    - This is stack LIFO behavior.
3. Store removed action in `redoStack`:
    - This allows the user to redo it later.
    - undoStack → redoStack
4. Re-render canvas: Canvas is cleared and all remaining strokes are drawn again.

`redo()` function:
1. Check if `redoStack` is empty: Nothing to redo → exit.
2. Take last undone stroke : Take the most recently undone stroke.
3. Put it back in `undoStack`: 
    - redoStack → undoStack
    - Now it's part of the drawing again.
4. Re-render the canvas: Redraw everything (including the restored stroke).

```js
function saveState() {
  const data = undoStack.map((cmd) => ({
    type: "draw",
    points: cmd.points,
  }));

  const json = JSON.stringify(data);
  return json;
}
```
1. `const data = undoStack.map((cmd) => ({ ... }));`:
    - Iterate over every `DrawCommand` instance in `undoStack` and transform it into a plain JavaScript object. This step creates a lightweight representation of the drawing history that can be serialized. Using plain objects avoids trying to serialize class instances directly.
2. `type: "draw",`:
    - Add a `type` field to each object. This is helpful if you later add other command types (e.g., `"rect"`, `"move"`, `"erase"`). When you load the state you can inspect `type` and reconstruct the correct command class for each item.
3. `points: cmd.points,`:
    - Copy the stroke data (the array of `{x,y}` points) into the serializable object. These are the minimal data needed to replay the stroke later.
4. `const json = JSON.stringify(data);`:
    - Convert the `data` array into a JSON string. `JSON.stringify` turns the in-memory objects into a text format safe for storage (localStorage), transmission, or file download.
5. `return json;`:
    - Return the JSON string so the caller can save it (e.g., `localStorage.setItem('drawing', json)`) or let the user copy/download it.


```js
function loadstate(json) {
  try {
    const data = JSON.parse(json);

    undoStack = data
      .map((item) => {
        if (item.type === "draw") {
          return new DrawCommand(item.points);
        }
        return null;
      })
      .filter(Boolean);

    redoStack = [];

    render();
  } catch (err) {
    console.error("Invalid JSON");
  }
}
```
1. `try { ... } catch (err) { ... }`:
    - Wraps the load process in a `try/catch` so parsing errors or unexpected data don’t crash the app; errors are caught and logged.
2. `const data = JSON.parse(json);`:
    - Converts the JSON string back into a JavaScript value (expected to be an array of plain objects produced by `saveState()`).
    - If `json` is not valid JSON, `JSON.parse` throws and control jumps to the `catch` block.
3. `undoStack = data.map(...).filter(Boolean);`:
    - Rebuilds the `undoStack` from the parsed array:
        - `.map(...)` transforms each plain object into a `DrawCommand` instance when the object has `type === "draw"`.
        - For unknown types the mapper returns `null`.
        - `.filter(Boolean)` removes `null` (and other falsy) entries so only valid commands remain in the new `undoStack`.
4. `if (item.type === "draw") return new DrawCommand(item.points);`:
    - For each serialized item of type `"draw"`, a new `DrawCommand` is created using the saved `points` array — this reconstructs the action objects used by your renderer.
5. `redoStack = [];`:
    - Clears the redo stack because loading a new state replaces the current history; any previously undone commands are no longer valid to redo.
6. `render();`:
    - Calls the central `render()` function which clears the canvas and iterates `undoStack`, invoking `execute(context)` on each command to rebuild the visible drawing from the restored history.
7. `catch (err) { console.error("Invalid JSON"); }`:
    - If anything goes wrong (malformed JSON or unexpected structure), an error is logged; this prevents uncaught exceptions and gives a clear message.

```js
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentPoints = [];
  currentPoints.push(getMousePosition(e));
});
```
1. `canvas.addEventListener("mousedown", (e) => { ... })`:
    - Registers a handler for the `mousedown` event on the canvas.
    - This function runs once when the user presses a mouse button down over the canvas.
    - `e` is the mouse event object containing coordinates and other info.
2. `isDrawing = true;`:
    - Sets the `isDrawing` flag to `true` meaning “we are now drawing.”
    - Other handlers (like `mousemove`) will check this flag so they only record points while the mouse is pressed.
    - Without this flag, `mousemove` would add stray points even when the user is just moving the cursor.
3. `currentPoints = [];`:
    - Clears the array that will store `{x, y}` points for this new stroke.
    - Important because each stroke must start with an empty list — otherwise old points would be mixed into the new stroke.
4. `currentPoints.push(getMousePosition(e));`:
    - Calls your `getMousePosition(e)` helper to convert the event’s viewport coordinates into canvas-local coordinates, and pushes that first point into `currentPoints`.
    - Recording the initial point ensures the stroke starts exactly where the user pressed the mouse down.

```js
canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;

  const points = getMousePosition(e);
  currentPoints.push(points);

  drawLine(context, currentPoints);
});
```
1. `canvas.addEventListener("mousemove", (e) => { ... })`:
    - Registers a handler that runs every time the mouse moves over the canvas. The event `e` contains the pointer coordinates.
2. `if (!isDrawing) return;`:
    - Early exit: if the mouse is moving but the user hasn’t pressed the button (`isDrawing` is `false`), do nothing.
    - This avoids adding points when the user is just moving the cursor (not drawing).
3. `const points = getMousePosition(e);`:
    - Calls your helper to translate `e.clientX/Y` (viewport coordinates) into coordinates relative to the canvas (e.g., `{ x: 150, y: 230 }`).
    - This gives the correct position to draw inside the canvas.
4. `currentPoints.push(points);`:
    - Adds the newly sampled point to `currentPoints`, the array accumulating all `{x,y}` samples for the stroke currently being drawn.
    - Over the course of the drag, `currentPoints` becomes something like `[{x:10,y:20}, {x:12,y:22}, ...]`.
5. `drawLine(context, currentPoints);`:
    - Renders a live preview of the stroke using all collected points so far.
    - Typically `drawLine` clears the canvas, redraws previous commands, and draws the current stroke on top (this avoids double-drawing and keeps the preview consistent).
    - This gives instant visual feedback as the user moves the pointer.

```js
canvas.addEventListener("mouseup", () => {
  if (!isDrawing) return;
  isDrawing = false;

  if (currentPoints.length < 2) return;

  const command = new DrawCommand([...currentPoints]);

  undoStack.push(command);

  redoStack = [];

  render();
});
```
1. `canvas.addEventListener("mouseup", () => { ... })`:
    - Registers a handler that runs when the user releases the mouse button over the canvas. This signals the end of a stroke.
2. `if (!isDrawing) return;`:
    - Safety guard: if `isDrawing` is `false` (e.g., mouseup fired without a prior mousedown on canvas), exit early. Prevents accidental commits.
3. `isDrawing = false;`:
    - Mark that drawing has ended. `mousemove` handlers check `isDrawing` and will ignore further pointer movements until the next `mousedown`.
4. `if (currentPoints.length < 2) return;`:
    - Another guard: if the collected points are fewer than 2, treat it as an insignificant stroke (a single click or noise) and skip saving. You could optionally handle single-point "dots" here if desired.
5. `const command = new DrawCommand([...currentPoints]);`:
    - Create a `DrawCommand` instance representing the completed stroke.
    - `[...]` (spread) makes a shallow copy of `currentPoints` so that later mutations to `currentPoints` won't change the stored command. This preserves the command's snapshot.
6. `undoStack.push(command);`:
    - Add the new command to the end of `undoStack`. This is the new “latest action” in history and will be replayed by `render()`.
7. `redoStack = [];`:
    - Clear the redo history because once you perform a new action after undoing, the previously undone actions are no longer valid to redo (standard editor semantics).
8. `render();`:
    - Call the central render function which clears the canvas and replays all commands from `undoStack` by calling `command.execute(context)` for each. This draws the newly committed stroke together with the existing history.

```js
document.getElementById("undo-btn").addEventListener("click", undo);
document.getElementById("redo-btn").addEventListener("click", redo);
document.getElementById("save-btn").addEventListener("click", () => {
  const json = saveState();
  alert("Saved");
  console.log(json);
});
document.getElementById("load-btn").addEventListener("click", () => {
  const json = prompt("Saved JSON: ");
  if (json) loadstate(json);
});
document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") return;

  if (e.ctrlKey && e.key === "z") {
    undo();
  }

  if (e.ctrlKey && e.key === "y") {
    redo();
  }
});
```
1. Button writing: undo/redo:
    - `document.getElementById("undo-btn").addEventListener("click", undo);`
    Attaches a click handler to the Undo button that calls your undo() function. This is the mouse-driven way for users to undo their last action.
    - `document.getElementById("redo-btn").addEventListener("click", redo);`
    Same for the Redo button — when clicked it runs `redo()`.
Why: Buttons provide an obvious UI control for undo/redo in addition to keyboard shortcuts.
2. Save button behavior:
    - `document.getElementById("save-btn").addEventListener("click", () => { ... });`
    When the Save button is clicked:
        - `const json = saveState();` — Calls `saveState()` to convert the `undoStack` into a JSON string representing the whole drawing/history.
        - `alert("Saved");` — Gives immediate feedback to the user that the save action happened (basic UX).
        - `console.log(json);` — Logs the JSON to the browser console so the user can copy it or you can debug.
Why: This lets users export the drawing state to text (and is a simple persistence method while developing).
3. Load button behavior:
    - `document.getElementById("load-btn").addEventListener("click", () => { ... });`
    When Load is clicked:
        - `const json = prompt("Saved JSON: ");`: Opens a prompt asking the user to paste a previously saved JSON string.
        - `if (json) loadstate(json);`:  If the user provided something, `loadstate(json)` parses it, rebuilds `undoStack`, clears `redoStack`, and calls `render()` to redraw the canvas.
Why: Simple manual restore flow for testing and demo. Works with the saveState() output.
4. Keyboard shortcuts (global):
    - `document.addEventListener("keydown", (e) => { ... });` — Adds a global listener for key presses.
    - `const active = document.activeElement; if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") return;`: This checks the element that currently has focus. If the user is typing in an `<input>` or `<textarea>`, the listener exits early so undo/redo keyboard combos don’t interfere with normal typing or browser form shortcuts.
    - `if (e.ctrlKey && e.key === "z") { undo(); }`
    If the user presses Ctrl+Z, call `undo()`. This mirrors common editor behavior.
    - `if (e.ctrlKey && e.key === "y") { redo(); }`
    If the user presses Ctrl+Y, call `redo()`.
Why: Keyboard shortcuts are standard and expected; combining them with button clicks provides a full editor experience.