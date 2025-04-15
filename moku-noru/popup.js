// popup.js

let timerDuration = 25 * 60; // 25 minutes
let timeLeft = timerDuration;
let timerInterval;

const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("start");
const resetBtn = document.getElementById("reset");
const breakBtn = document.getElementById("break");

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function startTimer() {
  if (timerInterval) return; // don't start twice

  // Tell background.js to mute tabs
  chrome.runtime.sendMessage("startFocus", (response) => {
    console.log(response.status);
  });

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      alert("Time's up! Take a break 🌿");
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeLeft = timerDuration;
  updateDisplay();
}

function startBreak() {
  if (timerInterval) return;

  timeLeft = 5 * 60; // 5 minutes
  updateDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      alert("Break's over! Time to focus 🧠");
    }
  }, 1000);
}

// Hook up the buttons
startBtn.addEventListener("click", startTimer);
resetBtn.addEventListener("click", resetTimer);
breakBtn.addEventListener("click", startBreak);

// Initialize display
updateDisplay();
