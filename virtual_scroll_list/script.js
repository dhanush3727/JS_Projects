document.addEventListener("DOMContentLoaded", () => {
  const viewport = document.getElementById("viewport");
  const items = document.getElementById("items");

  const itemCount = 100000;
  const data = Array.from({ length: itemCount }, (_, i) => `item ${i + 1}`);

  const itemHeight = 50;
  const viewportHeight = viewport.clientHeight;
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + 5;

  let startIndex = 0;
  let ticking = false;

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

  render();
  viewport.addEventListener("scroll", onScroll);
});
