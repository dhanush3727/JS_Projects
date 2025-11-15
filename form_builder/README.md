## Form Builder(Drag & Drop)
Build a visual form builder where the user can drag input elements (like text fields, checkboxes, etc.) from a toolbox onto a canvas to create a custom form. Then, automatically generate JSON schema for the created form and render it dynamically.

# Features
- Drag and drop interface for adding form elements
- Support for various input types (text, checkbox, radio buttons, dropdowns, etc.)
- Real-time JSON schema generation based on the form structure
- Dynamic rendering of the form based on the generated JSON schema
- Option to export the JSON schema for use in other applications

# Code Explanation 
```javascript
const canvas = document.getElementById("canvas");
const toolItems = document.querySelectorAll(".tool-item");
const schemaOutput = document.getElementById("schema-output");
const previewBtn = document.getElementById("preview-btn");
const previewArea = document.getElementById("preview-area");
const downloadBtn = document.getElementById("download");
const uploadBtn = document.getElementById("upload");

let formSchema = [];
```
Selecting necessary DOM elements and initializing an empty array `formSchema` to hold the structure of the form being built.

```javascript
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```
This `capitalize` function help to converts the first letter of `str` as uppercase ex: text - Text 

```javascript
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
```
This `createFieldElement` function helps to create and style a new form field dynamically based on the given `type`
  - `div`: Creates a wrapper container for each form field with border, pdadding and background styling.
  - `div.dataset.id`: Adds a unique ID for each field using the length of `formSchema`.
  - `label`: Displays the field name using the `capitalize` function.
  - `switch(type)`: Creates different field elements based on the type:
    - `text`: Creates an `<input type = "text">` with a placeholder.
    - `checkbox`: Creates an `<input type = checkbox>` and a label (option 1) wrapped inside a flex container.
    - `select`: Creates a `<select>` dropdown with two default options.
  - `editBtn` & `delBtn`: Buttons for editing and deleting the field.
  - `btnGroup`: Groups both buttons together and adds spacing.
  - Finally `div.append(label, input, btnGroup)`: Combines all parts and returns the completed field element.
Example : If we call `createFieldElement("text")`, it will generate a fully styled text input field with edit/delete buttons.

```javascript
function addFieldToSchema(type, id) {
  const field = {
    id,
    type: type,
    label: capitalize(type),
  };

  if (type === "text" || type === "email") {
    field.placeholder = `Enter ${type}`;
  }

  if (type === "select") {
    field.options = ["Option 1", "Option 2"];
  }

  formSchema.push(field);
}
```
This `addFieldToSchema` function helps to add a new field's data into the `formSchema` array which stores all the fields used in the form builder.
- `field`: Creates a new field object with `id`, `type`, and a `label`.
- `if(type === "text" || type === "email")`: Adds a placeholder property like "Enter Text" or "Enter email" for text-based fields.
- `if(type === "select")`: Adds a default `options` array for dropdown fields `(["Option 1", "Option 2"])`.
- `formSchema.push(field)`: Stores the newly created field inside the global `formSchema` array for later render or export.

```javascript
function updateSchemaDisplay() {
  schemaOutput.textContent = JSON.stringify(formSchema, null, 2);
}
```
This `updateSchemaDisplay` function helps to display the current `formSchema` on the screen in a readable format.
- `JSON.stringify(formSchema, null, 2)`: Converts the `formSchema` array into a formatted JSON string with 2 space indentation for better readability.
- `schemaOutput.textContent`: Updates the text inside the `schemaOutput` element to show the live schema.

```javascript
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
```
This `renderForm` function helps to visually render all form fields inside the canvas area based on the provided `schema`.
- `const fields = canvas.querySelectorAll(".form-field")`: Selects all the previously created form fields.
- `fields.forEach((field)=>field.remove())`: Removes old from fields before rendering the updated version
- `schema.forEach(...)`: Loops through each field object in the `schema` array to create matching HTML elements.
- `document.createElement("div")`: Creates a container for each field with some styling for spacing and layout.
- `switch(field.type)`: Dynamically renders input types (text, checkbox, or select) depending on the schema data.
- `editBtn` and `delBtn`: Adds edit and delete buttons for future field modifications.
- `canvas.appendChild(div)`: Adds each generated field into the main drop area.
- `updateSchemaDisplay()`: Refreshes and shows the latest JSON schema after rendering.

```javascript
toolItems.forEach((item) => {
  item.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("fieldType", e.target.dataset.type);
  });
});
```
This code helps to start the drag operation when the user drags a form element from the toolbox.
- `toolItems.forEach((item)=>{...})`: Loops through every draggable tool item like text, checkbox, or select.
- `item.addEventListener("dragstart", ...)`: Adds a listener to trigger when dragging begins.
- `e.dataTransfer.setData("fieldType", e.target.dataset.type)`: Stores the element type inside the drag event data.

```javascript
canvas.addEventListener("dragover", (e) => {
  e.preventDefault();
  canvas.style.background = "#eef2ff";
});

canvas.addEventListener("dragleave", () => {
  canvas.style.background = "";
});
```
This part handles the visual feedback while dragging an item over the drop area.
- `canvas.addEventListener("dragover", (e)=>{...})`: Fires continuously when a dragged item is moved over the canvas.
- `e.preventDefault()`: Enables dropping by preventing the default browser behavior(which normally disallows dropping).
- `canvas.style.background = "#eef2ff"`: Highlights the drop zone with a light color to show it's ready to receive the element.
- `canvas.addEventListener("dragleave",...)`: Triggers when the dragged item leaves the canvas area.
- `canvas.style.background = ""`: Resets the background color, removing the highlight effect.

```javascript
canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  canvas.style.background = "";
  const fieldType = e.dataTransfer.getData("fieldType");

  const newField = createFieldElement(fieldType);

  canvas.appendChild(newField);

  addFieldToSchema(fieldType, newField.dataset.id);
  updateSchemaDisplay();
});
```
This `drop` event handles what happens when a field type is dropped into the canvas area.
- `canvas.addEVentListener("drop" (e)=>{...})`: Triggers when the dragged element is dropped inside the canvas.
- `e.preventDefault()`: Prevents the default browser behavior so the drop action can occur.
- `canvas.style.background = ""`: Resets the background color after the drop.
- `const fieldType = e.dataTransfer.getData("fieldType")`: Retrieves the field type that was stored during dragstart.
- `const newfield = createFieldElement(fieldType)`: Dynamically creates a new DOM element for the dropped field using the helper function.
- `canvas.appendChild(newField)`: Adds the newly created field into the canvas visually.
- `addFieldToSchema(fieldType, newField.dataset.id)`: Updates the internal JSON schema to keep track of the dropped field's data.
- `updateSchemaDisplay()`: Re-renders the updated schema in the UI.

```javascript
canvas.addEventListener("click", (e) => {
  const parent = e.target.closest(".form-field");
  if (!parent) return;

  const fieldID = parent.dataset.id;

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

  if (e.target.classList.contains("delete-btn")) {
    formSchema = formSchema.filter((f) => f.id !== fieldID);
    parent.remove();
    updateSchemaDisplay();
  }
});
```
- `canvas.addEventListener("click",(e)=>{...})`: Uses event delegation to listen for button clicks inside the entire canvas area.
- `const parent = e.target.closest(".form-field")`: Finds the closest parent element that represents a form field. if clicked outside any field, it returns null.
- `if(!parent) return;`: Stops execution if the click wasn't inside a form field.
- `const fieldID = parent.dataset.id`: Gets the unique ID of the clicked field from its `data-id` attribute.
- `if(e.target.classList.contains("edit-btn"))`: Checks if the clicked element is an Edit button.
- `const field = formSchema.find((f)=>f.id === fieldID)`: Finds the matching field object in the schema.
- `const newLabel = prompt("Enter new label : ", field.label)`: Prompts the user to enter a new label for the field.
- `field.label = newLabel`: Updates the label in the schema object.
- `parent.querySelector("label").textContent = newLabel + " Field:"`: Updates the label text in the UI.
- `updateSchemaDisplay()`: Refreshes the schema JSON preview to reflect the changes.
- `if(e.target.classList.contains("delete-btn"))`: Checks if the clicked element is a Delete button.
- `formSchema = formSchema.filter((f)=>f.id !== fieldID)`: Removes the field object from the schema array.
- `parent.remove()`: Deletes the field from the DOM visually.
- `updateSchemaDisplay()`: Updates the JSON preview after deletion.

```javascript
previewBtn.addEventListener("click", () => {
  previewArea.replaceChildren();

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
```
- `preveiwBtn.addEventListener("click",()=>{...})`: When the preveiw button is clicked, this function runs.
- `previewArea.replaceChildren()`: Clears any previous preview content inside the preview area. This ensures only the latest version of the form is shown.
- `const form = document.createElement("form)`: Creates a new `<form>` element dynamically.
- `form.style.display = "flex"`: Makes the form use flexbox layout. This helps neatly align its inner elements vertically.
- `form.style.flexDirection = "column"`: Ensures all form fields appear one below another.
- `form.style.gap = '12px'`: Adds space between form elements.
- `formSchema.forEach((field)=>{...})`: Loops through every field that was added to the form builder. Each `field` contains info.
- `const div = document.createElement("div")`: Creates a container `<div>` for each form field.
- `div.className = "preview-field"`: Adds a class to style the preview fields later.
- `const label = document.createElement("label")`: Creates a `<label>` element to describe the field.
- `label.textContent = field.label`: Sets the text of the label based on the user defined label.
- `switch(field.type)`: Depending on what kind of field it is, we create the right element.
- `input.style.marginLeft = "10px"`: Adds a little spacing between the label and field.
- `div.append(label, input)`: Combines the label and input into one container.
- `form.appendChild(div)`: Adds each field to the main form.
- `previewArea.appendChild(form)`: Finally, displays the built form inside the preview section.

```javascript
downloadBtn.addEventListener("click", () => {
  const json = JSON.stringify(formSchema, null, 2);

  const blob = new Blob([json], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "formSchema.json";
  a.click();

  URL.revokeObjectURL(url);
});
```
- `downloadBtn.addEventListener("click",()=>{...})`: This runs when the download button is clicked.
- `const json = JSON.stringify(formSchema, null, 2)`:
  - Converts the `formSchema` into JSON string format.
  - into JSON string format. `null` means we're not modifying data.
  - `2` means add indentation 2 spaces for readability
- `const blob = new Blob([json], {type: "application/json"})`: 
  - Creates a BLOB(Binary Large Object) from the JSON string.
  - A blob is basically a file like object stored in memory.
  - The `type` tells the brwoser it's a JSON file.
- `const url = URL.createObjectURL(blob)`: Creates a temporary download URL pointing to that blob.
- `const a = document.createElement("a")`: Dynamically creates an `<a>` element.
- `a.href = url`: Sets its link to the blob file.
- `a.download = "formSchema.json"`: Tells the browser the file should be downloaded and gives it a filename.
- `a.click()`: Programmatically clicks the `<a>` tag, triggering the file download.
- `URL.revokeObjectURL(url)`: Frees up memory by removing the temporary blob URL once it's no longer needed.

```javascript
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
```
- `uploadBtn.addEventListener("change", (event)=>{...})`: Runs when the user selects a file from the upload input.
- The `"change"` event triggers whenever the selected file changes.
- `const file = event.target.files[0]`: `event.target.files` is an array of all selected files.
- Here, we take the first file.
- `if(!file) return`: If no file is selected, the function stops early avoids erros.
- `const reader = new FileReader()`: Creates a FileReader object which allows reading file contents directly from user's computer.
- `reader.onload = (e)=>{...}`: Defines what to do after the file has been successfully read.
- `e.target.result`: gives the file content as text.
- `JSON.parse()`: converts that JSON text back into a Javascript object.
- `formSchema = importedSchema`: Replaces your current `formSchema` with the data loaded from the file.
- `renderForm(formSchema)`: Calls your function to visually rebuild the form on the canvas using the imported schema.
- `catch(err){...}`: If the JSON file is invalid, it shows an alert.
- `reader.readAsText(file)`: Tells the `FileReader` to read the selected file as plain text .