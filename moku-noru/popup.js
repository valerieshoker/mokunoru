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
  runTimer(() => alert("Time's up! Take a break 🌿"));
}

function startBreakTimer() {
  if (timerInterval) return;
  isBreak = true;
  isPaused = false;
  timeLeft = breakDuration;
  setMode("break-mode");
  updateDisplay();
  runTimer(() => alert("Back to focus! 💪"));
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

function setGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" :
                   hour < 18 ? "Good afternoon" : "Good evening";
  document.getElementById("greeting").textContent = greeting;
}

const todoToday = document.getElementById("todo-today");
const todoLater = document.getElementById("todo-later");
const todoInput = document.getElementById("todo-input");
const addTaskBtn = document.getElementById("add-task");

// enable drag + drop between Today and Later
[todoToday, todoLater].forEach((ul, i) => {
  ul.addEventListener("dragover", (e) => {
    e.preventDefault(); // allow drop
    ul.style.background = "rgba(0,0,0,0.05)";
  });

  ul.addEventListener("dragleave", () => {
    ul.style.background = "";
  });

  ul.addEventListener("drop", (e) => {
    e.preventDefault();
    ul.style.background = "";

    const data = JSON.parse(e.dataTransfer.getData("text/plain"));

    const dragging = document.querySelector(".dragging");
    if (dragging) dragging.remove();

    addTodoToDOM(data.text, i === 0 ? "today" : "later", data.checked);
    saveTodos();
  });
});


const toastMessages = [
  "task complete!",
  "u did that",
  "proud of u pookie",
  "keep going. your future self is watching."
];

function saveTodos() {
  const today = collectTodosFromList(todoToday);
  const later = collectTodosFromList(todoLater);
  chrome.storage.local.set({ todosToday: today, todosLater: later });
}

function collectTodosFromList(ul) {
  return Array.from(ul.children).map(li => ({
    text: li.querySelector("span").textContent,
    checked: li.classList.contains("checked")
  }));
}

function addTodoToDOM(taskText, category = "today", isChecked = false) {
  const ul = category === "today" ? todoToday : todoLater;

  const li = document.createElement("li");
  li.draggable = true;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isChecked;
  checkbox.classList.add("todo-checkbox");

  const text = document.createElement("span");
  text.textContent = taskText;
  if (isChecked) li.classList.add("checked");

  // Drag support
  li.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({
      text: taskText,
      checked: isChecked
    }));
    e.dataTransfer.effectAllowed = "move";
    li.classList.add("dragging");
  });

  li.addEventListener("dragend", () => {
    li.classList.remove("dragging");
  });

  checkbox.addEventListener("change", () => {
    li.classList.toggle("checked");
    saveTodos();
    const toast = document.createElement("div");
    toast.textContent = toastMessages[Math.floor(Math.random() * toastMessages.length)];
    toast.className = "toast";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  });

  li.addEventListener("dblclick", () => {
    trashTask({
      text: text.textContent,
      category,
      checked: checkbox.checked
    });
    li.remove();
    saveTodos();
  });

  li.appendChild(checkbox);
  li.appendChild(text);
  ul.appendChild(li);
}

addTaskBtn.addEventListener("click", () => {
  const task = todoInput.value.trim();
  if (task) {
    addTodoToDOM(task, "today"); // ✅ always goes to Today initially
    saveTodos();
    todoInput.value = "";

    // 🐾 bounce the mascot when a task is added
    const mascot = document.getElementById("mascot");
    if (mascot) {
      mascot.classList.add("bounce");
      mascot.addEventListener("animationend", () => {
        mascot.classList.remove("bounce");
      }, { once: true });
    }
  }
});


function loadTodos() {
  chrome.storage.local.get(["todosToday", "todosLater"], (result) => {
    (result.todosToday || []).forEach(todo => addTodoToDOM(todo.text, "today", todo.checked));
    (result.todosLater || []).forEach(todo => addTodoToDOM(todo.text, "later", todo.checked));
  });
}

const trashBtn = document.getElementById("toggle-trash");
const trashBin = document.getElementById("trash-bin");
const trashedList = document.getElementById("trashed-tasks");

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

    const fresh = trashed.filter(task => !task.trashedAt || (now - task.trashedAt < 7 * 24 * 60 * 60 * 1000));
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

trashBtn.addEventListener("click", () => {
  const isHidden = trashBin.classList.contains("hidden");
  trashBin.classList.toggle("hidden", !isHidden);
  trashBtn.textContent = isHidden ? "Hide Archive" : "Archive";
  renderTrash();
});

startBtn.addEventListener("click", startFocusTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
breakBtn.addEventListener("click", startBreakTimer);

setGreeting();
updateDisplay();
setMode("focus-mode");
loadTodos();


const secretSequence = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'a', 'b'];
let inputHistory = [];
document.addEventListener("keydown", (e) => {
  inputHistory.push(e.key);
  inputHistory = inputHistory.slice(-secretSequence.length);
  if (secretSequence.every((key, i) => key === inputHistory[i])) {
    alert("u unlocked dev mode (jk, just impressed you knew this)");
  }
});


// Modal references
const instructionsModal = document.getElementById('instructionsModal');
const settingsModal = document.getElementById('settingsModal');
const closeInstructions = document.getElementById('closeInstructions');
const closeSettings = document.getElementById('closeSettings');

// Nav buttons
document.getElementById('nav-instructions').addEventListener('click', () => {
  instructionsModal.style.display = 'flex';
});

document.getElementById('nav-settings').addEventListener('click', () => {
  settingsModal.style.display = 'flex';
});

// Close buttons
closeInstructions.addEventListener('click', () => {
  instructionsModal.style.display = 'none';
});
closeSettings.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

// Close when clicking outside modal
window.addEventListener('click', (e) => {
  if (e.target === instructionsModal) instructionsModal.style.display = 'none';
  if (e.target === settingsModal) settingsModal.style.display = 'none';
});



const toggleThemeBtn = document.getElementById('toggleTheme');
const focusDurationInput = document.getElementById('focusDuration');
const breakDurationInput = document.getElementById('breakDurationInput');
const saveDurationsBtn = document.getElementById('saveDurations');

toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

window.addEventListener('load', () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  const savedFocus = localStorage.getItem('focusDuration');
  const savedBreak = localStorage.getItem('breakDuration');
  if (savedFocus) {
    focusDurationInput.value = savedFocus;
    timerDuration = parseInt(savedFocus) * 60;
    timeLeft = timerDuration;
    updateDisplay();
  }
  if (savedBreak) {
    breakDurationInput.value = savedBreak;
    breakDuration = parseInt(savedBreak) * 60;
  }
});

saveDurationsBtn.addEventListener('click', () => {
  const focusVal = parseInt(focusDurationInput.value);
  const breakVal = parseInt(breakDurationInput.value);
  if (focusVal > 0 && breakVal > 0) {
    timerDuration = focusVal * 60;
    breakDuration = breakVal * 60;
    timeLeft = timerDuration;
    updateDisplay();
    localStorage.setItem('focusDuration', focusVal);
    localStorage.setItem('breakDuration', breakVal);
    alert('Pomodoro durations updated!');
  } else {
    alert('Please enter valid numbers.');
  }
});

function resizePopup() {
  document.body.style.height = "auto";
  document.documentElement.style.height = "auto";
  document.body.style.minHeight = document.body.scrollHeight + "px";
}

window.addEventListener("load", () => {
  resizePopup();
  setTimeout(resizePopup, 50);
  setTimeout(resizePopup, 150);
});
