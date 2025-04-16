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
    alert("focus time 🧠");
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

// Hook up the buttons
startBtn.addEventListener("click", startFocusTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
breakBtn.addEventListener("click", startBreakTimer);

// Initialize display
updateDisplay();
setMode("focus-mode");
