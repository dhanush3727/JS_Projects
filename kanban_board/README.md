# Drag and Drop Kanban Board
A simple and interactive Kanban board application that allows users to create, edit, delete, and drag-and-drop tasks across different columns.

## Features
- Create, edit, and delete tasks
- Drag and drop tasks between columns
- Responsive design for desktop and mobile devices
- Persistent storage using localStorage
- User-friendly interface

## Explanation of Code
The application is built using HTML, CSS, and JavaScript. The main components of the code include:
1. **HTML Structure**: The HTML file defines the structure of the Kanban board, including columns for different task statuses (e.g., To Do, In Progress, Done) and a form for adding new tasks.
2. **CSS Styling**: The CSS file styles the Kanban board, ensuring a clean and responsive design that adapts to various screen sizes.
3. **JavaScript Functionality**: The JavaScript file handles the core functionality of the application, including:
- Adding new tasks
- Deleting tasks
- Drag-and-drop functionality for moving tasks between columns
- Event listeners for user interactions
    1. dragstart - This event is triggered when a user starts dragging a task. It sets the dragged task to a variable and hides the task element temporarily.
    2. dragend - This event is triggered when the user releases the dragged task. It makes the task visible again and clears the reference to the dragged task.
    3. dragover - This event is triggered when a dragged task is over a column. It prevents the default behavior to allow dropping and provides visual feedback by changing the column's background and border style. Must use e.preventDefault() to allow dropping.
    4. dragleave - This event is triggered when a dragged task leaves a column. It resets the column's background and border style to its original state.
    5. drop - This event is triggered when a dragged task is dropped into a column. It appends the dragged task to the new column's task list and resets the column's styles.

```javascript
const addBtn = document.querySelectorAll(".add-btn");
addBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    const column = btn.parentElement;
    const taskList = column.querySelector(".task-list");

    const taskText = prompt("Enter new Task");
    if (!taskText || !taskText.trim()) return;

    const task = document.createElement("div");
    task.classList.add("task");
    task.draggable = true;

    const span = document.createElement("span");
    span.classList.add("task-text");
    span.textContent = taskText.trim();

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.classList.add("delete-btn");
    delBtn.textContent = "X";

    task.appendChild(span);
    task.appendChild(delBtn);
    taskList.appendChild(task);

    addDragEvent(task);
  });
});
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const task = e.target.closest(".task");
    task.remove();
  }
});
```
This code defines the functionality for adding new tasks to the Kanban board. When the "Add Task" button is clicked, it prompts the user to enter a task description. If the input is valid, it creates a new task element, appends it to the appropriate column, and makes it draggable. 

```javascript
let draggedTask = null;
function addDragEvent(task) {
  task.addEventListener("dragstart", () => {
    draggedTask = task;
    setTimeout(() => {
      task.style.display = "none";
    }, 0);
  });

  task.addEventListener("dragend", () => {
    draggedTask.style.display = "block";
    draggedTask = null;
  });
}
```
This code snippet adds drag-and-drop functionality to each task. When a task is dragged, it temporarily hides the task element and stores a reference to it. When the drag operation ends, the task is made visible again.

```javascript
list.addEventListener("dragover", (e) => {
    e.preventDefault();
    list.style.background = "#e8f0fe";
    list.style.border = "2px dashed #4285f4";
  });
```
This code snippet handles the `dragover` event for the task list. It prevents the default behavior to allow dropping and provides visual feedback by changing the background and border style of the column when a task is dragged over it.

```javascript
list.addEventListener("dragleave", () => {
    list.style.background = "";
    list.style.border = "2px dashed transparent";
  });
```
This code snippet handles the `dragleave` event for the task list. It resets the column's background and border style to its original state when a dragged task leaves the column.

```javascript
list.addEventListener("drop", () => {
    list.style.background = "";
    list.style.border = "2px dashed transparent";
    if (draggedTask) list.appendChild(draggedTask);
  });