// State management
let words = JSON.parse(localStorage.getItem('words')) || [];
let currentSlideIndex = 0;
let currentCycle = 1;
let maxCycles = parseInt(localStorage.getItem('maxCycles')) || 1;
let isRecycleEnabled = JSON.parse(localStorage.getItem('isRecycleEnabled')) || false;
let activeWords = []; // New array to store words for current session

// DOM Elements
const wordInput = document.getElementById('word-input');
const meaningInput = document.getElementById('meaning-input');
const addWordBtn = document.getElementById('add-word');
const wordList = document.getElementById('word-list');
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const cyclesInput = document.getElementById('cycles');
const cyclesValue = document.getElementById('cycles-value');
const recycleCheckbox = document.getElementById('recycle');
const startCycleBtn = document.getElementById('start-cycle');
const slideView = document.getElementById('slide-view');
const closeSlidesBtn = document.getElementById('close-slides');
const slideWord = document.getElementById('slide-word');
const slideMeaning = document.getElementById('slide-meaning');
const wordNumber = document.getElementById('word-number');
const cycleCount = document.getElementById('cycle-count');

// Theme switching functionality
const themeToggle = document.getElementById('theme');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';
}

// Theme toggle event listener
themeToggle.addEventListener('change', function() {
    if (this.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
});

// Music functionality
const musicToggle = document.getElementById('music');
let backgroundMusic = null;

// Always start with music off
musicToggle.checked = false;

function handleMusicToggle() {
    if (musicToggle.checked) {
        if (!backgroundMusic) {
            backgroundMusic = new Audio('sounds/background.mp3');
            backgroundMusic.loop = true;
        }
        backgroundMusic.play();
    } else {
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }
    }
}

musicToggle.addEventListener('change', handleMusicToggle);

// Event Listeners
addWordBtn.addEventListener('click', addWord);
settingsToggle.addEventListener('click', toggleSettings);
cyclesInput.addEventListener('input', updateCyclesValue);
recycleCheckbox.addEventListener('change', updateRecycleSetting);
startCycleBtn.addEventListener('click', startCycle);
closeSlidesBtn.addEventListener('click', function(event) {
    event.stopPropagation();
    closeSlides();
});
slideView.addEventListener('click', nextSlide);
document.addEventListener('keydown', handleKeyPress);

// Functions
function addWord() {
    const word = wordInput.value.trim();
    const meaning = meaningInput.value.trim();
    
    if (word && meaning) {
        const newWord = {
            id: Date.now(),
            word,
            meaning,
            completed: false,
            cyclesCompleted: 0
        };
        
        words.push(newWord);
        saveWords();
        updateWordList();
        clearInputs();
    }
}

function clearInputs() {
    wordInput.value = '';
    meaningInput.value = '';
}

function updateWordList() {
    wordList.innerHTML = '';
    words.forEach(word => {
        const wordElement = createWordElement(word);
        wordList.appendChild(wordElement);
    });
}

function createWordElement(word) {
    const div = document.createElement('div');
    div.className = `word-item ${word.completed ? 'completed' : ''}`;
    
    div.innerHTML = `
        <div class="word-info">
            <div class="word-text">${word.word}</div>
            <div class="meaning-text">${word.meaning}</div>
            <div class="cycle-info">Cycles completed: ${word.cyclesCompleted}</div>
        </div>
        <div class="word-actions">
            <button class="icon-button edit-button" onclick="editWord(${word.id})" title="Edit word">
                <i class="fas fa-pen"></i>
            </button>
            <button class="icon-button delete-button" onclick="deleteWord(${word.id})" title="Delete word">
                <i class="fas fa-trash"></i>
            </button>
            ${word.completed ? `
                <button class="icon-button reset-button" onclick="resetWord(${word.id})" title="Reset progress">
                    <i class="fas fa-rotate"></i>
                </button>
            ` : ''}
        </div>
    `;
    
    return div;
}

function editWord(id) {
    const word = words.find(w => w.id === id);
    if (word) {
        const newWord = prompt('Enter new word:', word.word);
        const newMeaning = prompt('Enter new meaning:', word.meaning);
        
        if (newWord && newMeaning) {
            word.word = newWord;
            word.meaning = newMeaning;
            saveWords();
            updateWordList();
        }
    }
}

function deleteWord(id) {
    if (confirm('Are you sure you want to delete this word?')) {
        words = words.filter(w => w.id !== id);
        saveWords();
        updateWordList();
    }
}

function resetWord(id) {
    const word = words.find(w => w.id === id);
    if (word) {
        word.completed = false;
        word.cyclesCompleted = 0;
        saveWords();
        updateWordList();
    }
}

function toggleSettings() {
    settingsPanel.classList.toggle('hidden');
}

function updateCyclesValue() {
    maxCycles = parseInt(cyclesInput.value);
    cyclesValue.textContent = maxCycles;
    localStorage.setItem('maxCycles', maxCycles);
}

function updateRecycleSetting() {
    isRecycleEnabled = recycleCheckbox.checked;
    localStorage.setItem('isRecycleEnabled', isRecycleEnabled);
}

function startCycle() {
    // Filter out completed words for this session
    activeWords = words.filter(w => !w.completed);
    
    if (activeWords.length === 0) {
        alert('No words available for learning! Add new words or reset completed ones.');
        return;
    }
    
    currentSlideIndex = 0;
    currentCycle = 1;
    showSlide();
    slideView.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Hide scrollbar
}

function showSlide() {
    if (activeWords.length === 0) {
        closeSlides();
        return;
    }
    
    const word = activeWords[currentSlideIndex];
    slideWord.textContent = word.word;
    slideMeaning.textContent = word.meaning;
    wordNumber.textContent = `${currentSlideIndex + 1}/${activeWords.length}`;
    cycleCount.textContent = `Cycle ${currentCycle}/${maxCycles}`;
}

function nextSlide() {
    if (activeWords.length === 0) {
        closeSlides();
        return;
    }
    
    // Update cycles completed for the current word
    const currentWord = activeWords[currentSlideIndex];
    const wordInList = words.find(w => w.id === currentWord.id);
    if (wordInList) {
        wordInList.cyclesCompleted++;
        
        // Check if word has completed all cycles
        if (wordInList.cyclesCompleted >= maxCycles) {
            wordInList.completed = true;
            if (isRecycleEnabled) {
                words = words.filter(w => w.id !== wordInList.id);
            }
            // Remove from active words
            activeWords = activeWords.filter(w => w.id !== wordInList.id);
            saveWords();
            
            // If we've removed the last word, close slides
            if (activeWords.length === 0) {
                closeSlides();
                return;
            }
            
            // If we removed a word before the end, don't increment the slide index
            if (currentSlideIndex >= activeWords.length) {
                currentSlideIndex = 0;
                currentCycle++;
            }
            
            showSlide();
            return;
        }
    }
    saveWords();
    
    currentSlideIndex++;
    
    if (currentSlideIndex >= activeWords.length) {
        currentSlideIndex = 0;
        currentCycle++;
        
        if (currentCycle > maxCycles) {
            closeSlides();
            return;
        }
    }
    
    showSlide();
}

function closeSlides() {
    slideView.style.display = 'none';
    document.body.style.overflow = '';
    updateWordList();
}

function handleKeyPress(e) {
    if (slideView.style.display !== 'none' && (e.key === 'Enter' || e.key === ' ')) {
        nextSlide();
    }
}

function saveWords() {
    localStorage.setItem('words', JSON.stringify(words));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Ensure slide view is hidden on startup
    slideView.style.display = 'none';
    
    // Initialize settings from localStorage
    cyclesInput.value = maxCycles;
    cyclesValue.textContent = maxCycles;
    recycleCheckbox.checked = isRecycleEnabled;
    
    // Initialize the word list
    updateWordList();
}); 