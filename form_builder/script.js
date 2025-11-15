// Select Elements
const canvas = document.getElementById("canvas");
const toolItems = document.querySelectorAll(".tool-item");
const schemaOutput = document.getElementById("schema-output");
const previewBtn = document.getElementById("preview-btn");
const previewArea = document.getElementById("preview-area");
const downloadBtn = document.getElementById("download");
const uploadBtn = document.getElementById("upload");

// form schema
let formSchema = [];

// Capitalize first letter of field
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Create a DOM element dynamically
function createFieldElement(type) {
  const div = document.createElement("div");
  div.className = "form-field";
  div.dataset.id = "field- " + (formSchema.length + 1);
  div.style.margin = "10px 0";
  div.style.padding = "10px";
  div.style.border = "1px dashed #ccc";
  div.style.borderRadius = "8px";
  div.style.background = "#fafafa";

  const label = document.createElement("label");
  label.textContent = `${capitalize(type)} Field: `;

  let input;

  switch (type) {
    case "text":
      input = document.createElement("input");
      input.type = type;
      input.placeholder = `Enter ${type}`;
      break;

    case "checkbox":
      input = document.createElement("input");
      input.type = "checkbox";
      input.id = "option1";

      const checkboxLabel = document.createElement("label");
      checkboxLabel.textContent = "option 1";
      checkboxLabel.htmlFor = "option1";

      //   Wrap input + label together
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.append(input, checkboxLabel);
      input = wrapper;
      break;

    case "select":
      input = document.createElement("select");
      const opt1 = document.createElement("option");
      opt1.textContent = "Option 1";
      const opt2 = document.createElement("option");
      opt2.textContent = "Option 2";
      input.append(opt1, opt2);
      break;
  }

  //   Add edit/delete button
  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.className = "edit-btn";
  editBtn.style.marginRight = "10px";

  const delBtn = document.createElement("button");
  delBtn.textContent = "Delete";
  delBtn.className = "delete-btn";

  const btnGroup = document.createElement("div");
  btnGroup.style.marginTop = "8px";
  btnGroup.append(editBtn, delBtn);

  input.style.marginLeft = "10px";
  div.append(label, input, btnGroup);

  return div;
}

// Add field to JSON schema
function addFieldToSchema(type, id) {
  const field = {
    id,
    type: type,
    label: capitalize(type),
  };

  //   Extra properties based on field type
  if (type === "text" || type === "email") {
    field.placeholder = `Enter ${type}`;
  }

  if (type === "select") {
    field.options = ["Option 1", "Option 2"];
  }

  formSchema.push(field);
}

// Update JSON schema display
function updateSchemaDisplay() {
  schemaOutput.textContent = JSON.stringify(formSchema, null, 2);
}

// Render the form from import schema
function renderForm(schema) {
  const fields = canvas.querySelectorAll(".form-field");
  fields.forEach((field) => field.remove());

  schema.forEach((field) => {
    const div = document.createElement("div");
    div.className = "form-field";
    div.dataset.id = field.id;
    div.style.margin = "10px 0";
    div.style.padding = "10px";
    div.style.border = "1px dashed #ccc";
    div.style.borderRadius = "8px";
    div.style.background = "#fafafa";

    const label = document.createElement("label");
    label.textContent = `${capitalize(field.type)} Field: `;

    let input;

    switch (field.type) {
      case "text":
        input = document.createElement("input");
        input.type = field.type;
        input.placeholder = `Enter ${field.type}` || field.placeholder;
        break;

      case "checkbox":
        input = document.createElement("input");
        input.type = "checkbox";
        input.id = "option1";

        const checkboxLabel = document.createElement("label");
        checkboxLabel.textContent = "option 1";
        checkboxLabel.htmlFor = "option1";

        //   Wrap input + label together
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.append(input, checkboxLabel);
        input = wrapper;
        break;

      case "select":
        input = document.createElement("select");
        const opt1 = document.createElement("option");
        opt1.textContent = "Option 1";
        const opt2 = document.createElement("option");
        opt2.textContent = "Option 2";
        input.append(opt1, opt2);
        break;
    }

    //   Add edit/delete button
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "edit-btn";
    editBtn.style.marginRight = "10px";

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "delete-btn";

    const btnGroup = document.createElement("div");
    btnGroup.style.marginTop = "8px";
    btnGroup.append(editBtn, delBtn);

    input.style.marginLeft = "10px";
    div.append(label, input, btnGroup);
    canvas.appendChild(div);
  });
  updateSchemaDisplay();
}

// Drag Start
// Triggered when dragging starts from toolbox
toolItems.forEach((item) => {
  item.addEventListener("dragstart", (e) => {
    // Store field type (like text, email, etc.) inside dataTransfer
    e.dataTransfer.setData("fieldType", e.target.dataset.type);
  });
});

// Drag Over
// Allow dropping by preventing default behavior
canvas.addEventListener("dragover", (e) => {
  e.preventDefault();
  canvas.style.background = "#eef2ff";
});

// Drag Leave
// Reset background when dragging leaves the canvas
canvas.addEventListener("dragleave", () => {
  canvas.style.background = "";
});

// Drop Event
// Create the dropped field dynamically
canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  canvas.style.background = "";
  const fieldType = e.dataTransfer.getData("fieldType");

  //   Create new field DOM
  const newField = createFieldElement(fieldType);

  // Append to canvas
  canvas.appendChild(newField);

  //   Update JSON schema
  addFieldToSchema(fieldType, newField.dataset.id);
  updateSchemaDisplay();
});

// Event Delegation for edit/delete
canvas.addEventListener("click", (e) => {
  const parent = e.target.closest(".form-field");
  if (!parent) return;

  const fieldID = parent.dataset.id;

  // Edit the label
  if (e.target.classList.contains("edit-btn")) {
    const field = formSchema.find((f) => f.id === fieldID);
    if (!field) return;

    const newLabel = prompt("Enter new label : ", field.label);
    if (newLabel) {
      field.label = newLabel;
      parent.querySelector("label").textContent = newLabel + " Field:";
      updateSchemaDisplay();
    }
  }

  // Delete Button
  if (e.target.classList.contains("delete-btn")) {
    formSchema = formSchema.filter((f) => f.id !== fieldID);
    parent.remove();
    updateSchemaDisplay();
  }
});

// Preview Form
previewBtn.addEventListener("click", () => {
  previewArea.replaceChildren(); // Clear previous preview

  // Build form dynamically
  const form = document.createElement("form");
  form.style.display = "flex";
  form.style.flexDirection = "column";
  form.style.gap = "12px";

  formSchema.forEach((field) => {
    const div = document.createElement("div");
    div.className = "preview-field";

    const label = document.createElement("label");
    label.textContent = field.label;

    let input;

    switch (field.type) {
      case "text":
        input = document.createElement("input");
        input.type = field.type;
        input.placeholder = `Enter ${field.type}`;
        break;

      case "checkbox":
        input = document.createElement("input");
        input.type = field.type;
        input.id = "option1";

        const checkboxLabel = document.createElement("label");
        checkboxLabel.textContent = "option 1";
        checkboxLabel.htmlFor = "option1";

        //   Wrap input + label together
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.append(input, checkboxLabel);
        input = wrapper;
        break;

      case "select":
        input = document.createElement("select");
        const opt1 = document.createElement("option");
        opt1.textContent = "Option 1";
        const opt2 = document.createElement("option");
        opt2.textContent = "Option 2";
        input.append(opt1, opt2);
        break;
    }

    input.style.marginLeft = "10px";
    div.append(label, input);
    form.appendChild(div);
  });

  previewArea.appendChild(form);
});

// Download the schema
downloadBtn.addEventListener("click", () => {
  // Convert schema object to JSON string
  const json = JSON.stringify(formSchema, null, 2);

  // File handling
  const blob = new Blob([json], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  // Create hidden download link
  const a = document.createElement("a");
  a.href = url;
  a.download = "formSchema.json";
  a.click();

  URL.revokeObjectURL(url); // Clean memory
});

// Upload the schema
uploadBtn.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedSchema = JSON.parse(e.target.result);
      formSchema = importedSchema;
      renderForm(formSchema);
    } catch (err) {
      alert("Invalid JSON file");
      console.log(err);
    }
  };

  reader.readAsText(file);
});
