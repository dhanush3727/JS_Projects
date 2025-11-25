let isDrawing = false; // we currently drawing
let currentPoints = []; // stores points for the stroke being drawn

let undoStack = []; // history of completed DrawCommand objects
let redoStack = []; // commands popped from undoStack for redo

const canvas = document.getElementById("canvas"); // reference to <canvas> element
const context = canvas.getContext("2d"); // the 2D drawing context

canvas.width = window.innerWidth; // canvas pixel width
canvas.height = window.innerHeight - 60; // canvas pixel height (leave space for toolbar)

context.strokeStyle = "black"; // line color
context.lineWidth = 2; // thickness of lines
context.lineCap = "round"; // how line ends are drawn (rounded ends)
context.lineJoin = "round"; // how joints between segments are drawn (rounded corners)

function getMousePosition(e) {
  return {
    x: e.clientX - canvas.offsetLeft,
    y: e.clientY - canvas.offsetTop,
  };
}

function drawLine(context, points) {
  if (points.length < 2) return; // nothing to draw with fewer than 2 points

  context.beginPath(); // start a new drawing path
  context.moveTo(points[0].x, points[0].y); // move the pen to the first point without drawing

  // iterate over remaining points
  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, points[i].y); // add a straight segment to each next point
  }

  context.stroke(); // paint the path using current stroke style
}

function render() {
  context.clearRect(0, 0, canvas.width, canvas.height); // clear the entire canvas before redrawing

  // loop through each stored drawing command
  for (const command of undoStack) {
    command.execute(context); // re-execute every command to rebuild the drawing
  }
}

function undo() {
  if (undoStack.length === 0) return; //nothing to undo

  const command = undoStack.pop(); // remove the last drawn stroke
  redoStack.push(command); // move it to redoStack

  render(); // redraw canvas without the removed stroke
}

function redo() {
  if (redoStack.length === 0) return; // nothing to redo

  const command = redoStack.pop(); // take back the last undone stroke
  undoStack.push(command); // move it to undoStack

  render(); // redraw canvas including restored stroke
}

function saveState() {
  // convert each command into a plain serializable object
  const data = undoStack.map((cmd) => ({
    type: "draw", // mark the command type so we can distinguish later
    points: cmd.points, // include the raw points that define the stroke
  }));

  const json = JSON.stringify(data); // convert the array of objects to a JSON string
  return json; // return the JSON string for saving/exporting
}

function loadstate(json) {
  try {
    const data = JSON.parse(json); // parse JSON string into JS objects

    undoStack = data // transform serialized items back into commands
      .map((item) => {
        // only handle draw-type items for now
        if (item.type === "draw") {
          return new DrawCommand(item.points); // recreate a DrawCommand from saved points
        }
        return null; // unknown types become null (ignored)
      })
      .filter(Boolean); // remove nulls and falsy values from the array

    redoStack = []; // clear redo history when loading a new state

    render(); // re-render the canvas from the restored undoStack
  } catch (err) {
    console.error("Invalid JSON"); // log error if JSON.parse failed or data is malformed
  }
}

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true; // mark that the user has started a drawing action
  currentPoints = []; // reset current stroke points to start fresh
  currentPoints.push(getMousePosition(e)); // record the first point (mouse pos inside canvas)
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return; // ignore mouse movement when the user is not drawing

  const points = getMousePosition(e); // convert viewport coordinates to canvas-local {x,y}
  currentPoints.push(points); // append the new sample point to the current stroke

  drawLine(context, currentPoints); // draw a live preview of the stroke using collected points
});

canvas.addEventListener("mouseup", () => {
  if (!isDrawing) return; // ignore if mouse was not down (no active stroke)
  isDrawing = false; // stop the drawing session

  if (currentPoints.length < 2) return; // if stroke too short (click or noise), do nothing

  const command = new DrawCommand([...currentPoints]); // create a new DrawCommand with a COPY of points

  undoStack.push(command); // push the finished command into history (undo stack)

  redoStack = []; // clear redo stack because new action breaks redo chain

  render(); // re-render the canvas from the updated undoStack
});

document.getElementById("undo-btn").addEventListener("click", undo); // call undo() when Undo button is clicked
document.getElementById("redo-btn").addEventListener("click", redo); // call redo() when Redo button is clicked
// on Save button click...
document.getElementById("save-btn").addEventListener("click", () => {
  const json = saveState(); //  create JSON snapshot of current drawing
  alert("Saved"); //  notify the user (simple feedback)
  console.log(json); //  print JSON to console for copying/debugging
});
// on Load button click...
document.getElementById("load-btn").addEventListener("click", () => {
  const json = prompt("Saved JSON: "); //  ask user to paste saved JSON
  if (json) loadstate(json); //  if provided, restore state from JSON
});
// global keyboard listener
document.addEventListener("keydown", (e) => {
  const active = document.activeElement; // find the currently focused element
  if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") return; // ignore shortcuts while typing in inputs

  // Ctrl + Z => Undo
  if (e.ctrlKey && e.key === "z") {
    undo();
  }

  // Ctrl + Y => Redo
  if (e.ctrlKey && e.key === "y") {
    redo();
  }
});
