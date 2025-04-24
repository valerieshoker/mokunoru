// popup.js

let timerDuration = 25 * 60; // 25 minutes
let breakDuration = 5 * 60;  // 5 minutes
let timeLeft = timerDuration;
let timerInterval = null;
let isPaused = false;
let isBreak = false;

const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const breakBtn = document.getElementById("break");
const toggleBtn = document.getElementById("toggle-todo");
const todoContainer = document.getElementById("todo-container");
const toastMessages = [
  "task complete!",
  "u did that",
  "proud of u pookie",
  "keep going. your future self is watching."
];


function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function setMode(mode) {
  document.body.classList.remove("focus-mode", "break-mode");
  document.body.classList.add(mode);
}

function runTimer(onComplete) {
  timerInterval = setInterval(() => {
    if (!isPaused) {
      timeLeft--;
      updateDisplay();

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        onComplete();
      }
    }
  }, 1000);
}

function startFocusTimer() {
  if (timerInterval) return;

  isBreak = false;
  isPaused = false;
  timeLeft = timerDuration;
  setMode("focus-mode");
  updateDisplay();

  chrome.runtime.sendMessage("startFocus", (response) => {
    console.log(response.status);
  });

  runTimer(() => {
    alert("time's up! take a break 🌿");
  });
}

function startBreakTimer() {
  if (timerInterval) return;

  isBreak = true;
  isPaused = false;
  timeLeft = breakDuration;
  setMode("break-mode");
  updateDisplay();

  runTimer(() => {
    alert("focus time");
  });
}

function pauseTimer() {
  if (!timerInterval) {
    console.log("Pause button clicked, but timer isn't running.");
    return;
  }

  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isPaused = false;
  timeLeft = isBreak ? breakDuration : timerDuration;
  updateDisplay();
  setMode(isBreak ? "break-mode" : "focus-mode");
  pauseBtn.textContent = "Pause";
}

// hook up buttons
startBtn.addEventListener("click", startFocusTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
breakBtn.addEventListener("click", startBreakTimer);

// initialize display
updateDisplay();
setMode("focus-mode");

const todoToday = document.getElementById("todo-today");
const todoLater = document.getElementById("todo-later");
const categorySelect = document.getElementById("category-select");
const todoInput = document.getElementById("todo-input");
const addTaskBtn = document.getElementById("add-task");

function saveTodos() {
  const today = collectTodosFromList(todoToday);
  const later = collectTodosFromList(todoLater);
  chrome.storage.local.set({ todosToday: today, todosLater: later });
}

function loadTodos() {
  chrome.storage.local.get(["todosToday", "todosLater"], (result) => {
    const today = result.todosToday || [];
    const later = result.todosLater || [];
    today.forEach((todo) => addTodoToDOM(todo.text, "today", todo.checked));
    later.forEach((todo) => addTodoToDOM(todo.text, "later", todo.checked));
  });
}

function collectTodosFromList(ul) {
  return Array.from(ul.children).map((li) => ({
    text: li.querySelector("span").textContent,
    checked: li.classList.contains("checked")
  }));
}

function addTodoToDOM(taskText, category = "today", isChecked = false) {
  const ul = category === "today" ? todoToday : todoLater;

  const li = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isChecked;
  checkbox.classList.add("todo-checkbox");

  const text = document.createElement("span");
  text.textContent = taskText;

  if (isChecked) li.classList.add("checked");

  // checkbox listener
  checkbox.addEventListener("change", () => {
    li.classList.toggle("checked");
    saveTodos();

    // toast message logic
    const toast = document.createElement("div");
    const message = toastMessages[Math.floor(Math.random() * toastMessages.length)];
    toast.textContent = message;
    toast.className = "toast";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  });

  // append checkbox and text properly
  li.appendChild(checkbox);
  li.appendChild(text);

  checkbox.addEventListener("change", () => {
    li.classList.toggle("checked");
    saveTodos();
  
    const toast = document.createElement("div");
    const message = toastMessages[Math.floor(Math.random() * toastMessages.length)];
    toast.textContent = message;
    toast.className = "toast";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  
    if (checkbox.checked) {
      li.classList.add("fade-out");
      setTimeout(() => {
        li.remove();
        saveTodos();
      }, 400); // match CSS duration
    }
  });
  

  ul.appendChild(li);
}


addTaskBtn.addEventListener("click", () => {
  const task = todoInput.value.trim();
  const category = categorySelect.value;
  if (task) {
    addTodoToDOM(task, category);
    saveTodos();
    todoInput.value = "";
  }
});

loadTodos();

toggleBtn.addEventListener("click", () => {
  const isHidden = todoContainer.style.display === "none";
  todoContainer.style.display = isHidden ? "block" : "none";
  toggleBtn.textContent = isHidden ? "Hide To-Do List" : "Show To-Do List";
});
const secretSequence = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'a', 'b'];
let inputHistory = [];

document.addEventListener("keydown", (e) => {
  inputHistory.push(e.key);
  inputHistory = inputHistory.slice(-secretSequence.length);
  if (secretSequence.every((key, i) => key === inputHistory[i])) {
    alert("u unlocked dev mode (jk, just impressed you knew this)");
  }
});

document.querySelectorAll(".section-toggle").forEach(button => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    const list = document.getElementById(targetId);

    const isCollapsed = list.style.display === "none";
    list.style.display = isCollapsed ? "block" : "none";
    button.textContent = targetId.includes("today") ? "Today" : "Later";
  });
});
