let timerDuration = 25 * 60;
let breakDuration = 5 * 60;
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

const todoToday = document.getElementById("todo-today");
const todoLater = document.getElementById("todo-later");
const categorySelect = document.getElementById("category-select");
const todoInput = document.getElementById("todo-input");
const addTaskBtn = document.getElementById("add-task");

const trashBtn = document.getElementById("toggle-trash");
const trashBin = document.getElementById("trash-bin");
const trashedList = document.getElementById("trashed-tasks");

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
  if (!timerInterval) return;
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

function saveTodos() {
  const today = collectTodosFromList(todoToday);
  const later = collectTodosFromList(todoLater);
  chrome.storage.local.set({ todosToday: today, todosLater: later });
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

  checkbox.addEventListener("change", () => {
    li.classList.toggle("checked");
    saveTodos();
    const toast = document.createElement("div");
    const message = toastMessages[Math.floor(Math.random() * toastMessages.length)];
    toast.textContent = message;
    toast.className = "toast";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  });

  li.appendChild(checkbox);
  li.appendChild(text);

  // trash logic 
  li.addEventListener("dblclick", () => {
    trashTask({
      text: text.textContent,
      category,
      checked: checkbox.checked
    });
    li.remove();
    saveTodos();
  });

  ul.appendChild(li);
}

function trashTask(task) {
  const taskWithTimestamp = {
    ...task,
    trashedAt: Date.now()
  };

  chrome.storage.local.get(["trashedTodos"], (result) => {
    const trashed = result.trashedTodos || [];
    trashed.push(taskWithTimestamp);
    chrome.storage.local.set({ trashedTodos: trashed });
  });
}


function renderTrash() {
  chrome.storage.local.get(["trashedTodos"], (result) => {
    const now = Date.now();
    const trashed = result.trashedTodos || [];

    const fresh = trashed.filter(task => {
      return !task.trashedAt || (now - task.trashedAt < 7 * 24 * 60 * 60 * 1000);
    });

    // Clean up expired ones
    if (fresh.length !== trashed.length) {
      chrome.storage.local.set({ trashedTodos: fresh });
    }

    trashedList.innerHTML = "";

    fresh.forEach((task, index) => {
      const li = document.createElement("li");
      li.textContent = `${task.text} (${task.category})`;

      const restoreBtn = document.createElement("button");
      restoreBtn.textContent = "Restore";
      restoreBtn.addEventListener("click", () => {
        restoreTask(index, task);
      });

      li.appendChild(restoreBtn);
      trashedList.appendChild(li);
    });
  });
}

function restoreTask(index, task) {
  chrome.storage.local.get(["trashedTodos", "todosToday", "todosLater"], (result) => {
    const trashed = result.trashedTodos || [];
    trashed.splice(index, 1);

    const listName = task.category === "later" ? "todosLater" : "todosToday";
    const list = result[listName] || [];
    list.push({ text: task.text, checked: task.checked });

    chrome.storage.local.set({
      trashedTodos: trashed,
      [listName]: list
    }, () => {
      addTodoToDOM(task.text, task.category, task.checked);
      renderTrash();
    });
  });
}

startBtn.addEventListener("click", startFocusTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
breakBtn.addEventListener("click", startBreakTimer);

updateDisplay();
setMode("focus-mode");
loadTodos();

addTaskBtn.addEventListener("click", () => {
  const task = todoInput.value.trim();
  const category = categorySelect.value;
  if (task) {
    addTodoToDOM(task, category);
    saveTodos();
    todoInput.value = "";
  }
});

const todoOfShame = ["this one task... you know the one"];

trashBtn.addEventListener("click", () => {
  const isHidden = trashBin.style.display === "none";
  trashBin.style.display = isHidden ? "block" : "none";
  trashBtn.textContent = isHidden ? "Hide Trash" : "View Trash";
  renderTrash();
});

function loadTodos() {
  chrome.storage.local.get(["todosToday", "todosLater"], (result) => {
    const today = result.todosToday || [];
    const later = result.todosLater || [];
    today.forEach((todo) => addTodoToDOM(todo.text, "today", todo.checked));
    later.forEach((todo) => addTodoToDOM(todo.text, "later", todo.checked));
  });
}

document.querySelectorAll(".section-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const section = document.getElementById(targetId);
    if (section) {
      const isHidden = section.style.display === "none";
      section.style.display = isHidden ? "block" : "none";
      btn.textContent = isHidden ? targetId === "todo-today" ? "Today" : "Later" : `Show ${btn.textContent}`;
    }
  });
});


// easter egg
const secretSequence = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'a', 'b'];
let inputHistory = [];
document.addEventListener("keydown", (e) => {
  inputHistory.push(e.key);
  inputHistory = inputHistory.slice(-secretSequence.length);
  if (secretSequence.every((key, i) => key === inputHistory[i])) {
    alert("u unlocked dev mode (jk, just impressed you knew this)");
  }
});
