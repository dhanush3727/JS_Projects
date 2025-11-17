// DOM Elements
const stack = document.getElementById("stack-content");
const webApi = document.getElementById("webapis-content");
const microtaskQueue = document.getElementById("microtask-content");
const macrotaskQueue = document.getElementById("macrotask-content");
const outputContent = document.getElementById("output-content");

function animateAppend(parent, element) {
  element.classList.add("fade-slide");
  parent.appendChild(element);

  // Smooth enter
  requestAnimationFrame(() => {
    element.classList.add("show");
  });
}

export function updateStack(list) {
  stack.innerHTML = "";

  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "stack-item fade-slide";
    div.textContent = item;

    animateAppend(stack, div);
  });
}

export function updateWebAPI(list) {
  webApi.innerHTML = "";

  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "queue-item fade-slide";
    div.textContent = typeof item === "object" ? item.name : item;

    animateAppend(webApi, div);
  });
}

export function updateMicrotaskQueue(list) {
  microtaskQueue.innerHTML = "";

  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "queue-item fade-slide";
    div.textContent = item;

    animateAppend(microtaskQueue, div);
  });
}

export function updateMacrotaskQueue(list) {
  macrotaskQueue.innerHTML = "";

  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "queue-item fade-slide";
    div.textContent = item;

    animateAppend(macrotaskQueue, div);
  });
}

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
