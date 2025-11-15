# Virtual Scroll List
A lightweight and efficient virtual scroll list component for rendering large lists in web applications. This component only renders the visible items in the viewport, significantly improving performance and reducing memory usage.

## Features
- Virtual scrolling for large datasets
- Smooth scrolling experience

## Code Explanation
The core logic of the virtual scroll list is implemented in `script.js`. It calculates which items should be rendered based on the current scroll position and updates the DOM accordingly. The `spacer` element is used to create the illusion of a full list by setting its height to the total height of all items, while only rendering a subset of items in the `items` container.

```javascript
document.addEventListener("DOMContentLoaded", () => {
// all other codes here...
});
```
`DOMContentLoaded` event listener ensures that the script runs only after the DOM is fully loaded. This code snippet is waits for the DOM to be fully parsed before running the code. 

```javascript 
// Grab DOM nodes
const viewport = document.getElementById("viewport");
const items = document.getElementById("items");
```
- `viewport`: the scrollable container (the element with fixed height + overflow-y : auto). 
- `items`: the container that will hold the currently rendered item elements and will be moved vertically with transform

```javascript
const itemCount = 100000;
const data = Array.from({ length: itemCount }, (_, i) => `item ${i + 1}`);
const itemHeight = 50;
```
- `itemCount`: total number of logical items in the list (100k here).
- `data`: an array of strings representing each item, in a real app this 
could be objects fetched from an API.
- `itemHeight`: fixed height for each item.
**NOTES: In this code I didn't set a spacer element height, this spacer would help that browser scrollbar representing the full list.**

```javascript
//Calculate how many items fit in the viewport
const viewportHeight = viewport.clientHeight;
const visibleCount = Math.ceil(viewportHeight / itemHeight) + 5;
```
- `viewport.clientHeight`: visible height of the scroll area.
- `Math.ceil(viewportHeight / itemHeight) + 5`: minimal number of whole items that fit vertically. +5 is a buffer. We render a few extra items above/below the visible window so fast scrolling doesn't reveal blank space.
- `visibleCount` is how many DOM nodes you will create and keep at once

```javascript
let startIndex = 0;
let ticking = false;
```
- `statIndex`: The index of the first item currently rendered. Initially 0.
- `ticking`: A boolean used to throttle updates via `requestAnimationFrame` so you don't queue multiple rapid action force callbacks per frame.

```javascript
  function render() {
    const fragment = document.createDocumentFragment();

    const endIndex = Math.min(startIndex + visibleCount, itemCount);
    items.innerHTML = "";

    for (let i = startIndex; i < endIndex; i++) {
      const div = document.createElement("div");
      div.className = "item";
      div.textContent = data[i];
      fragment.appendChild(div);
    }

    items.appendChild(fragment);

    items.style.transform = `translateY(${startIndex * itemHeight}px)`;
  }
```
- Create a `DocumentFragment` to build nodes off-DOM (faster).
- Compute `endIndex` for stop index for rendering; clamp to `itemCount`.
- `items.innderHTML = ""`: clear previous rendered nodes. (Clearing is safe; I am not inserting untrusted HTML).
- Loop from `startIndex` to less than `endIndex`: Create a `.item` div, set `textContent`, append to fragment.
- Append the fragment to `items` in one operation, minimizes reflows.
- Set `items.style.transform = translateY(${startIndex * itemHeight}px)` to visually offset the block of rendered items to the correct vertical location, so they appear at the same position they would if everything were rendered.
- Result: Even though the DOM only contains `visibleCount` nodes, the user sees them at the correct scroll position.
**NOTES: document.createDocumentFragment() creates a lightweight, invisibe container(called a DocumentFragment) that can hold DOM nodes. It's like a temporary mini-DOM that lives only in memory, not yet attached to the real page.**

```javascript
function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = viewport.scrollTop;
        const newStartIndex = Math.floor(scrollTop / itemHeight);

        if (newStartIndex !== startIndex) {
          startIndex = newStartIndex;
          render();
        }
        ticking = false;
      });

      ticking = true;
    }
  }
```
- Scroll events fire many times per frame. `ticking` + `requestAnimationFram` ensures you schedule at most one update per animation frame.
- Inside the rapid action force callback:
    - Read `viewport.scrollTop` and compute `newStartIndex`.
    - If `newStartIndex` changed, update `startIndex` and call `render()`.
    - Reset `ticking = false` so further scrolls can schedule new frames.
- This keeps rendering work synced to the browser's paint cycle and prevents over-updating.

```javascript
render();
viewport.addEventListener("scroll", onScroll);
```
- `render()`: draws the initial visible items (startIndex = 0).
- `viewport.addEventListener("scroll", onScroll)`: listens for user scrolling.