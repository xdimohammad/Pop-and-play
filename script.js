"use strict";

/* ==========================================
   MY LITTLE POP & PLAY
   JAVASCRIPT - FIXED CARD INTERACTION
========================================== */

let score = 0;
let soundEnabled = true;
let musicEnabled = false;
let audioContext = null;
let musicTimer = null;
let musicIndex = 0;
let speechSequence = 0;
let activeCard = null;

const $ = id => document.getElementById(id);

/* ELEMENTS */
const game = $("game");
const scoreDisplay = $("score");
const progressFill = $("progressFill");
const progressText = $("progressText");
const feedbackText = $("feedbackText");
const gardenMessage = $("gardenMessage");

const bunny = $("bunny");
const rainbow = $("rainbow");
const flowerGarden = $("flowerGarden");
const magicHearts = $("magicHearts");

const soundButton = $("soundButton");
const musicButton = $("musicButton");
const fullscreenButton = $("fullscreenButton");
const resetButton = $("resetButton");

const celebration = $("celebration");
const celebrationEmoji = $("celebrationEmoji");
const celebrationTitle = $("celebrationTitle");
const celebrationMessage = $("celebrationMessage");
const celebrationButton = $("celebrationButton");

const wordCards = [...document.querySelectorAll(".word-card")];

/* REWARDS */
const rewards = {
  10: {
    emoji: "🐰",
    title: "Magic Bunny!",
    message: "Wonderful! The Magic Bunny is here!"
  },
  20: {
    emoji: "🌸",
    title: "Magic Flowers!",
    message: "Look! The magic flowers are blooming!"
  },
  30: {
    emoji: "🌈",
    title: "Magic Rainbow!",
    message: "Amazing! You made a beautiful rainbow!"
  }
};

/* ==========================================
   AUDIO EFFECTS
========================================== */

function getAudio() {
  const AudioClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioClass) return null;

  if (!audioContext) {
    audioContext = new AudioClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTone(frequency, duration = 0.15, volume = 0.1) {
  if (!soundEnabled) return;

  const audio = getAudio();
  if (!audio) return;

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime);

  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    volume,
    audio.currentTime + 0.025
  );
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audio.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(audio.destination);

  oscillator.start();
  oscillator.stop(audio.currentTime + duration + 0.05);
}

function playPopSound() {
  if (!soundEnabled) return;

  playTone(740, 0.12, 0.12);

  setTimeout(() => {
    playTone(1046, 0.15, 0.09);
  }, 90);
}

function playRewardSound() {
  if (!soundEnabled) return;

  [523, 659, 784, 1047].forEach((note, index) => {
    setTimeout(() => {
      playTone(note, 0.25, 0.11);
    }, index * 190);
  });
}

/* ==========================================
   FEMALE ENGLISH VOICE
========================================== */

let availableVoices = [];

function loadVoices() {
  if (!("speechSynthesis" in window)) return;

  availableVoices = window.speechSynthesis.getVoices();
}

if ("speechSynthesis" in window) {
  loadVoices();

  window.speechSynthesis.addEventListener(
    "voiceschanged",
    loadVoices
  );
}

const femaleVoiceNames = [
  "samantha",
  "ava",
  "allison",
  "susan",
  "karen",
  "moira",
  "tessa",
  "victoria",
  "fiona",
  "serena",
  "zoe",
  "siri female",
  "google uk english female",
  "google us english female",
  "female",
  "woman"
];

function chooseEnglishFemaleVoice() {
  loadVoices();

  const englishVoices = availableVoices.filter(voice =>
    voice.lang &&
    voice.lang.toLowerCase().startsWith("en")
  );

  if (!englishVoices.length) return null;

  let selected = englishVoices.find(voice =>
    /female|woman|girl/i.test(voice.name)
  );

  if (selected) return selected;

  selected = englishVoices.find(voice => {
    const name = voice.name.toLowerCase();

    return femaleVoiceNames.some(keyword =>
      name.includes(keyword)
    );
  });

  if (selected) return selected;

  selected = englishVoices.find(voice =>
    /natural|enhanced|premium|neural/i.test(voice.name)
  );

  if (selected) return selected;

  return (
    englishVoices.find(voice =>
      /en-gb|en-au/i.test(voice.lang)
    ) || englishVoices[0]
  );
}

/* ==========================================
   SPEECH CONTROL
========================================== */

function unlockPreviousCard() {
  if (!activeCard) return;

  activeCard.classList.remove("speaking");
  activeCard.disabled = false;
  activeCard = null;
}

function cancelCurrentSpeech() {
  speechSequence++;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  unlockPreviousCard();
}

function speakWord(word, card) {
  if (!soundEnabled) return;

  if (!("speechSynthesis" in window)) {
    feedbackText.textContent = "Voice is not supported on this device.";
    return;
  }

  /*
    IMPORTANT:
    Every new tap cancels the previous speech.
    This prevents cards from becoming locked.
  */

  cancelCurrentSpeech();

  const thisSequence = speechSequence;

  activeCard = card;
  card.classList.add("speaking");

  const utterance = new SpeechSynthesisUtterance(word);
  const voice = chooseEnglishFemaleVoice();

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "en-GB";
  }

  utterance.rate = 0.78;
  utterance.pitch = 1.08;
  utterance.volume = 1;

  function finish() {
    if (thisSequence !== speechSequence) return;

    if (activeCard === card) {
      card.classList.remove("speaking");
      card.disabled = false;
      activeCard = null;
    }
  }

  utterance.onend = finish;
  utterance.onerror = finish;

  try {
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    finish();
  }

  /*
    Fallback unlock in case the browser does not
    send an onend or onerror event.
  */

  setTimeout(() => {
    finish();
  }, 5000);
}

/* ==========================================
   BACKGROUND MUSIC
========================================== */

const melody = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 880, 698.46
];

function playMusicNote() {
  if (!musicEnabled) return;

  const audio = getAudio();
  if (!audio) return;

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = melody[musicIndex];

  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.linearRampToValueAtTime(
    0.03,
    audio.currentTime + 0.08
  );
  gain.gain.linearRampToValueAtTime(
    0.001,
    audio.currentTime + 0.42
  );

  oscillator.connect(gain);
  gain.connect(audio.destination);

  oscillator.start();
  oscillator.stop(audio.currentTime + 0.45);

  musicIndex = (musicIndex + 1) % melody.length;
}

function startMusic() {
  stopMusic();

  getAudio();

  musicEnabled = true;
  musicButton.textContent = "🎶";

  playMusicNote();

  musicTimer = setInterval(playMusicNote, 520);
}

function stopMusic() {
  musicEnabled = false;

  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }

  musicButton.textContent = "🎵";
}

function toggleMusic() {
  if (musicEnabled) {
    stopMusic();
  } else {
    startMusic();
  }
}

/* ==========================================
   SOUND BUTTON
========================================== */

function toggleSound() {
  soundEnabled = !soundEnabled;

  soundButton.textContent = soundEnabled ? "🔊" : "🔇";

  if (!soundEnabled) {
    cancelCurrentSpeech();
  } else {
    playTone(700, 0.15, 0.1);
  }
}

/* ==========================================
   FULLSCREEN
========================================== */

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    if (game.requestFullscreen) {
      await game.requestFullscreen();
      return;
    }

    game.classList.toggle("fake-fullscreen");

  } catch (error) {
    game.classList.toggle("fake-fullscreen");
  }
}

fullscreenButton.addEventListener("click", toggleFullscreen);

document.addEventListener("fullscreenchange", () => {
  game.classList.remove("fake-fullscreen");
});

/* ==========================================
   SCORE
========================================== */

function updateScore() {
  scoreDisplay.textContent = score;

  progressFill.style.width =
    Math.min(score / 30 * 100, 100) + "%";

  progressText.textContent =
    Math.min(score, 30) + " / 30 stars";
}

/* ==========================================
   MAGIC FLOWERS
========================================== */

function updateFlowers() {
  const unlocked = score >= 20;

  flowerGarden.classList.toggle("blooming", unlocked);
  magicHearts.classList.toggle("visible", unlocked);
}

/* ==========================================
   MAGIC REWARDS
========================================== */

function updateRewards() {
  const bunnyUnlocked = score >= 10;
  const flowerUnlocked = score >= 20;
  const rainbowUnlocked = score >= 30;

  bunny.classList.toggle("visible", bunnyUnlocked);
  rainbow.classList.toggle("visible", rainbowUnlocked);

  $("rewardBunny").classList.toggle("unlocked", bunnyUnlocked);
  $("rewardFlower").classList.toggle("unlocked", flowerUnlocked);
  $("rewardRainbow").classList.toggle("unlocked", rainbowUnlocked);

  if (rainbowUnlocked) {
    gardenMessage.textContent = "🌈 Magic Rainbow unlocked!";
  } else if (flowerUnlocked) {
    gardenMessage.textContent = "🌸 Magic Flowers are blooming!";
  } else if (bunnyUnlocked) {
    gardenMessage.textContent = "🐰 Magic Bunny is hopping!";
  } else {
    gardenMessage.textContent = "Welcome to the Magic Garden!";
  }
}

/* ==========================================
   CELEBRATION
========================================== */

function showCelebration(reward) {
  celebrationEmoji.textContent = reward.emoji;
  celebrationTitle.textContent = reward.title;
  celebrationMessage.textContent = reward.message;

  celebration.classList.add("show");

  playRewardSound();
}

function hideCelebration() {
  celebration.classList.remove("show");
}

celebrationButton.addEventListener("click", hideCelebration);

/* ==========================================
   WORD CARDS
========================================== */

function popWordCard(card) {
  /*
    No activeCard lock here.
    All four cards remain tappable.
  */

  const word = card.dataset.word;

  if (!["MUMMY", "DADDY", "EAT", "SLEEP"].includes(word)) {
    return;
  }

  feedbackText.textContent = word + "! 💖";

  score++;

  updateScore();
  updateFlowers();
  updateRewards();

  playPopSound();

  if (rewards[score]) {
    const reward = rewards[score];

    setTimeout(() => {
      showCelebration(reward);
    }, 500);
  }

  speakWord(word, card);
}

wordCards.forEach(card => {
  card.disabled = false;

  card.addEventListener("click", () => {
    popWordCard(card);
  });
});

/* ==========================================
   RESET GAME
========================================== */

function resetGame() {
  score = 0;

  cancelCurrentSpeech();

  wordCards.forEach(card => {
    card.disabled = false;
    card.classList.remove("speaking");
  });

  updateScore();
  updateFlowers();
  updateRewards();

  feedbackText.textContent = "Tap a word to hear it! 💖";

  hideCelebration();

  playTone(600, 0.18, 0.1);
}

resetButton.addEventListener("click", resetGame);

/* ==========================================
   BUTTON EVENTS
========================================== */

soundButton.addEventListener("click", toggleSound);
musicButton.addEventListener("click", toggleMusic);

/* ==========================================
   START GAME
========================================== */

function startGame() {
  updateScore();
  updateFlowers();
  updateRewards();

  feedbackText.textContent = "Tap a word to hear it! 💖";
}

startGame();