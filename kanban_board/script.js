// Add and Delete the task
const addBtn = document.querySelectorAll(".add-btn"); // get all add buttons
// Event listener for adding tasks
addBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Get the parent column and its task list
    const column = btn.parentElement;
    const taskList = column.querySelector(".task-list");

    // Prompt user for task text
    const taskText = prompt("Enter new Task");
    if (!taskText || !taskText.trim()) return;

    // Create task element
    const task = document.createElement("div");
    task.classList.add("task");
    task.draggable = true;

    // Create span for task text
    const span = document.createElement("span");
    span.classList.add("task-text");
    span.textContent = taskText.trim();

    // Create delete button
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.classList.add("delete-btn");
    delBtn.textContent = "X";

    // Append elements
    task.appendChild(span);
    task.appendChild(delBtn);
    taskList.appendChild(task);

    // Add drag event listeners to the new task
    addDragEvent(task);
  });
});
// Event listener for deleting tasks
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const task = e.target.closest(".task");
    task.remove();
  }
});

// Drag & Drop
let draggedTask = null; // Variable to hold the currently dragged task
// Function to add drag event listeners to a task
function addDragEvent(task) {
  // Drag start event
  task.addEventListener("dragstart", () => {
    draggedTask = task; // Set the dragged task
    // Hide the task after a brief delay to ensure drag image works correctly
    setTimeout(() => {
      task.style.display = "none";
    }, 0);
  });

  // Drag end event
  task.addEventListener("dragend", () => {
    draggedTask.style.display = "block"; // Make the task visible again
    draggedTask = null; // Clear the reference to the dragged task
  });
}
// Add drag event listeners to existing tasks
const taskLists = document.querySelectorAll(".task-list");
taskLists.forEach((list) => {
  // Add drag event listeners to each task in the list
  list.addEventListener("dragover", (e) => {
    e.preventDefault(); // Allow dropping by preventing default behavior
    list.style.background = "#e8f0fe"; // Change background for visual feedback
    list.style.border = "2px dashed #4285f4"; // Change border style for visual feedback
  });

  // Drag leave event
  list.addEventListener("dragleave", () => {
    list.style.background = ""; // Reset background
    list.style.border = "2px dashed transparent"; // Reset border style
  });

  // Drop event
  list.addEventListener("drop", () => {
    list.style.background = ""; // Reset background
    list.style.border = "2px dashed transparent"; // Reset border style
    if (draggedTask) list.appendChild(draggedTask); // Append the dragged task to the new list
  });
});
