/* ==========================================================
   SECTION 1: THEME TOGGLE (dark / light + localStorage)
=========================================================== */
const toggleInput = document.getElementById("toggle-input");
const statusId = document.getElementById("status-id");
const themeStorageKey = "my saved preference";

// localStorage sync hota hai, lekin humne isko Promise ke andar
// wrap kiya hai taake await/async ki practice ho sake
function saveToStorage(key, value) {
  return new Promise((resolve, reject) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setTimeout(() => resolve(), 150);
    } catch (err) {
      reject(err);
    }
  });
}

function loadFromStorage(key) {
  return new Promise((resolve, reject) => {
    try {
      const raw = localStorage.getItem(key);
      setTimeout(() => {
        resolve(raw === null ? null : JSON.parse(raw));
      }, 150);
    } catch (err) {
      reject(err);
    }
  });
}

async function initTheme() {
  try {
    const savedValue = await loadFromStorage(themeStorageKey);
    if (savedValue === null) {
      statusId.textContent = "No theme saved yet";
    } else {
      toggleInput.checked = savedValue;
      document.body.classList.toggle("dark", savedValue);
      statusId.textContent = `Current theme is ${savedValue ? "dark" : "light"}`;
    }
  } catch (err) {
    console.log(err, "theme preference could not load");
  }
}

async function onThemeToggle() {
  const isDark = toggleInput.checked;
  document.body.classList.toggle("dark", isDark);
  statusId.textContent = "Saving...";

  try {
    await saveToStorage(themeStorageKey, isDark);
    statusId.textContent = `Saved! Now in ${isDark ? "Dark" : "Light"} mode.`;
  } catch (err) {
    statusId.textContent = "Failed to save your preference.";
    console.error("Error saving preference:", err);
  }
}

toggleInput.addEventListener("change", onThemeToggle);
initTheme();


/* ==========================================================
   SECTION 2: TO-DO LIST STATE
=========================================================== */
const form = document.getElementById("todoform");
const input = document.getElementById("todoinput");
const status = document.getElementById("status-todo");
const list = document.getElementById("todolist");
const counter = document.getElementById("counter");

const todoStorageKey = "to do storage";
let tasks = [];
let draggedTaskId = null;

function saveTasks(tasksArray) {
  return new Promise((resolve, reject) => {
    try {
      localStorage.setItem(todoStorageKey, JSON.stringify(tasksArray));
      setTimeout(() => resolve(), 150);
    } catch (err) {
      reject(err);
    }
  });
}

function loadTasks() {
  return new Promise((resolve, reject) => {
    try {
      const raw = localStorage.getItem(todoStorageKey);
      setTimeout(() => {
        resolve(raw === null ? [] : JSON.parse(raw));
      }, 140);
    } catch (err) {
      reject(err);
    }
  });
}

function updateCounter() {
  const remaining = tasks.filter((t) => !t.done).length;
  counter.textContent = `${remaining} task${remaining === 1 ? "" : "s"} left`;
}

async function initList() {
  try {
    tasks = await loadTasks();
    renderList();
    status.textContent = `${tasks.length} task(s) loaded`;
  } catch (err) {
    status.textContent = "Could not load your tasks";
    console.log("tasks failed to load", err);
  }
}


/* ==========================================================
   SECTION 3: RENDERING THE LIST
=========================================================== */
function renderList() {
  list.innerHTML = "";
  const visibleTasks = getFilteredTasks();

  if (visibleTasks.length === 0) {
    const emptyMessage = document.createElement("span");
    emptyMessage.className = "empety";
    emptyMessage.textContent = "No tasks found...";
    list.appendChild(emptyMessage);
    updateCounter();
    return;
  }

  visibleTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = task.done ? "completed" : "";
    li.draggable = true;
    li.dataset.id = task.id;

    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("click", () => toggleTask(task.id));

    const span = document.createElement("span");
    span.className = "tasktext";
    span.textContent = task.text;
    span.addEventListener("dblclick", () => startEdit(task.id, span));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.className = "delete";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.append(checkbox, span, deleteBtn);
    list.appendChild(li);
  });

  updateCounter();
}


/* ==========================================================
   SECTION 4: ADD / EDIT / DELETE / TOGGLE
=========================================================== */
function startEdit(id, spanElement) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const editBox = document.createElement("input");
  editBox.type = "text";
  editBox.className = "editinput";
  editBox.value = task.text;
  spanElement.replaceWith(editBox);
  editBox.focus();
  editBox.select();

  editBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") editBox.blur();
    if (event.key === "Escape") renderList();
  });

  editBox.addEventListener("blur", () => {
    const newText = editBox.value.trim();
    if (newText === "") {
      renderList(); // empty edit -> cancel instead of saving blank
      return;
    }
    editTask(id, newText);
  });
}

async function editTask(id, newText) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, text: newText } : task
  );
  renderList();

  try {
    await saveTasks(tasks);
    status.textContent = "Task updated";
  } catch (err) {
    status.textContent = "Could not update task";
    console.log(err, "edit failed");
  }
}

async function addTask(text) {
  const newTask = {
    id: Date.now(),
    done: false,
    text: text,
  };
  tasks.push(newTask);
  renderList();

  try {
    await saveTasks(tasks);
    status.textContent = "Task added";
  } catch (err) {
    status.textContent = "Could not add task";
    console.log(err, "add failed");
  }
}

async function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  renderList();

  try {
    await saveTasks(tasks);
    status.textContent = "Task deleted";
  } catch (err) {
    status.textContent = "Could not delete task";
    console.log(err, "delete failed");
  }
}

async function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  renderList();

  try {
    await saveTasks(tasks);
    status.textContent = "Task updated";
  } catch (err) {
    console.log("toggle failed", err);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const newTaskText = input.value.trim();
  if (newTaskText === "") {
    status.textContent = "Please type something first!";
    return;
  }
  addTask(newTaskText);
  input.value = "";
});

initList();


/* ==========================================================
   SECTION 5: FILTER + SEARCH
=========================================================== */
const filterButtonsWrapper = document.querySelector(".filterbuttons");
const searchInput = document.getElementById("searchInput");

let currentFilter = "all";
let searchValue = "";

function getFilteredTasks() {
  let results = tasks;

  if (searchValue !== "") {
    results = results.filter((t) =>
      t.text.toLowerCase().includes(searchValue)
    );
  }

  if (currentFilter === "incomplete") return results.filter((t) => !t.done);
  if (currentFilter === "complete") return results.filter((t) => t.done);
  return results;
}

filterButtonsWrapper.addEventListener("click", (event) => {
  if (!event.target.classList.contains("filterbtn")) return;

  currentFilter = event.target.dataset.filter;
  document
    .querySelectorAll(".filterbtn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");
  renderList();
});

// simple debounce, taake har letter par render na ho, thoda smooth lage
let searchTimer = null;
searchInput.addEventListener("input", (event) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchValue = event.target.value.trim().toLowerCase();
    renderList();
  }, 200);
});


/* ==========================================================
   SECTION 6: DRAG AND DROP REORDERING
=========================================================== */
function handleDragStart(event) {
  draggedTaskId = Number(event.currentTarget.dataset.id);
  event.currentTarget.classList.add("dragging");
}

function handleDragOver(event) {
  event.preventDefault(); // ye zaroori hai warna drop event fire nahi hoga
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
}

async function handleDrop(event) {
  event.preventDefault();
  const targetId = Number(event.currentTarget.dataset.id);
  if (targetId === draggedTaskId) return;

  const draggedIndex = tasks.findIndex((t) => t.id === draggedTaskId);
  const targetIndex = tasks.findIndex((t) => t.id === targetId);

  const [movedTask] = tasks.splice(draggedIndex, 1);
  tasks.splice(targetIndex, 0, movedTask);
  renderList();

  try {
    await saveTasks(tasks);
    status.textContent = "Reordered successfully";
  } catch (err) {
    console.log("reorder save failed", err);
  }
}


/* ==========================================================
   SECTION 7: EXPORT / IMPORT (backup as JSON file)
=========================================================== */
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

function exportTasks() {
  const dataStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "my-tasks.json";
  link.click();

  URL.revokeObjectURL(url);
}

importFile.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const importedTasks = JSON.parse(e.target.result);
      tasks = importedTasks;
      renderList();
      await saveTasks(tasks);
      status.textContent = "File imported successfully";
    } catch (err) {
      status.textContent = "Could not import this file";
      console.log(err, "import failed");
    }
  };
  reader.readAsText(file);
});

importBtn.addEventListener("click", () => importFile.click());
exportBtn.addEventListener("click", exportTasks);
