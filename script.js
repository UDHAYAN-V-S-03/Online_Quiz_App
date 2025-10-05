// --- Global Game State Variables ---
let quizConfig = {};
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
const QUESTION_TIME = 15; // 15 seconds per question
const USER_ANSWERS = []; // Store user answers and results for review

// --- DOM Element Selection (Global Scope) ---
const htmlElement = document.documentElement; // For theme switching
const themeToggleBtn = document.getElementById('theme-toggle');
const configScreen = document.getElementById('config-screen');
const quizScreen = document.getElementById('quiz-screen');
const reviewScreen = document.getElementById('review-screen');

// Quiz Elements
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextQuestionBtn = document.getElementById('next-question-btn');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar');
const questionTimer = document.getElementById('question-timer');

// Quiz Context Elements
const quizCategoryDisplay = document.getElementById('quiz-category');
const quizDifficultyDisplay = document.getElementById('quiz-difficulty');
const reviewContainer = document.getElementById('review-container');

// New Loading/Timer Elements
const loadingOverlay = document.getElementById('loading-overlay');
const timerProgressBar = document.getElementById('timer-progress-bar');

// Modal Elements
const previewModal = document.getElementById('preview-modal');
const countdownDisplay = document.getElementById('countdown-display');
const confirmationModal = document.getElementById('confirmation-modal');
const resultsModal = document.getElementById('results-modal');

// Modal Action Buttons
const cancelQuizBtn = document.getElementById('cancel-quiz');
const startQuizBtn = document.getElementById('start-quiz-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const exitQuizBtn = document.getElementById('exit-quiz-btn');
const viewAnswersBtn = document.getElementById('view-answers-btn');
const exitToMenuBtn = document.getElementById('exit-to-menu-btn');
const reviewToMenuBtn = document.getElementById('review-to-menu-btn');


// --- Utility Functions ---

function htmlDecode(input) {
    const doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

function switchScreen(activeScreen) {
    // Deactivate all screens
    [configScreen, quizScreen, reviewScreen].forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });

    // Activate the requested screen
    activeScreen.classList.add('active');
    activeScreen.style.display = 'block';
}

function showModal(modalElement) {
    modalElement.classList.add('visible');
}

function hideModal(modalElement) {
    modalElement.classList.remove('visible');
}

/**
 * Retrieves the display name from the select list based on the user's choice.
 * Handles "Any Category" (value='any' or '') and "Any Difficulty" (value='').
 */
function getDisplayName(elementId, value) {
    const selectElement = document.getElementById(elementId);
    if (!selectElement) return value; 

    const option = Array.from(selectElement.options).find(opt => opt.value === value);
    
    if (option) {
        return option.textContent;
    }

    return 'Any';
}


// --- Theme Toggle Logic ---

const setTheme = (theme) => {
    htmlElement.setAttribute('data-theme', theme);
    themeToggleBtn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('theme', theme);
};


// --- Game Flow and State Management ---

function startNewGame() {
    score = 0;
    currentQuestionIndex = 0;
    questions = [];
    USER_ANSWERS.length = 0;
    
    switchScreen(quizScreen);
    fetchQuestions(quizConfig);
}


// --- API Integration (Updated with Loading Overlay) ---

async function fetchQuestions(config) {
    const baseUrl = 'https://opentdb.com/api.php';
    
    const params = new URLSearchParams({
        amount: config.amount,
        encode: 'url3986'
    });

    if (config.category) params.append('category', config.category);
    if (config.difficulty) params.append('difficulty', config.difficulty);
    if (config.type) params.append('type', config.type);

    const url = `${baseUrl}?${params.toString()}`;

    // 1. Show Loading Spinner
    loadingOverlay.classList.add('visible');
    questionText.textContent = "Fetching questions...";
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // 2. Hide Loading Spinner on success or error
        loadingOverlay.classList.remove('visible');

        if (data.response_code !== 0) {
             // Error handling for "No Results Found"
            if (data.response_code === 1) {
                questionText.textContent = "Error: No questions found for this configuration. Please adjust your criteria.";
            } else {
                questionText.textContent = "Error: Could not fetch questions. Try changing categories or amount.";
            }
            console.error("API Error Response Code:", data.response_code);
            return;
        }

        questions = data.results.map(q => {
            const decodedCorrect = htmlDecode(decodeURIComponent(q.correct_answer));
            const decodedIncorrect = q.incorrect_answers.map(ans => htmlDecode(decodeURIComponent(ans)));
            
            const options = [...decodedIncorrect, decodedCorrect];
            options.sort(() => Math.random() - 0.5);
            
            return {
                question: htmlDecode(decodeURIComponent(q.question)),
                correct_answer: decodedCorrect,
                options: options,
                user_selected: null
            };
        });
        
        displayQuestion();

    } catch (error) {
        // 2. Hide Loading Spinner on network error
        loadingOverlay.classList.remove('visible');
        questionText.textContent = "Network Error. Please check your connection.";
        console.error("Fetch Error:", error);
    }
}


// --- Display and Game Logic (Updated context setting & Timer Bar) ---

function displayQuestion() {
    const q = questions[currentQuestionIndex];
    if (!q) {
        endQuiz();
        return;
    }

    // Set Context Info (FIXED: Uses the correct display name logic)
    const categoryValue = document.getElementById('category').value;
    const difficultyValue = document.getElementById('difficulty').value;
    
    quizCategoryDisplay.textContent = `Category: ${getDisplayName('category', categoryValue)}`;
    quizDifficultyDisplay.textContent = `Difficulty: ${getDisplayName('difficulty', difficultyValue)}`;
    
    // Reset UI state
    nextQuestionBtn.disabled = true;
    optionsContainer.innerHTML = '';
    
    // Update question text
    questionText.textContent = q.question;

    // Update progress bar
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;

    // Create option buttons
    q.options.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option-btn');
        // Added role for accessibility (A11y)
        button.setAttribute('role', 'radio'); 
        button.textContent = option;
        button.addEventListener('click', () => handleAnswer(button, option, q));
        optionsContainer.appendChild(button);
    });

    startQuestionTimer();
}

function startQuestionTimer() {
    clearInterval(timerInterval);
    let timeLeft = QUESTION_TIME;
    questionTimer.textContent = `${timeLeft}s`;
    questionTimer.classList.remove('running-out');
    
    // Initialize timer bar to full width
    timerProgressBar.style.width = '100%';

    timerInterval = setInterval(() => {
        timeLeft--;
        questionTimer.textContent = `${timeLeft}s`;

        // Calculate and update progress bar width
        const progressPercent = (timeLeft / QUESTION_TIME) * 100;
        timerProgressBar.style.width = `${progressPercent}%`;

        if (timeLeft <= 5 && timeLeft > 0) {
            questionTimer.classList.add('running-out');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleAnswer(null, null, questions[currentQuestionIndex]);
            nextQuestionBtn.disabled = false;
            setTimeout(nextQuestion, 1000); 
        }
    }, 1000);
}

function handleAnswer(selectedButton, selectedAnswer, questionData) {
    clearInterval(timerInterval);
    
    const isCorrect = selectedAnswer === questionData.correct_answer;

    Array.from(optionsContainer.children).forEach(btn => {
        btn.disabled = true;
        
        if (btn.textContent === questionData.correct_answer) {
            btn.classList.add('correct');
        } else if (btn === selectedButton) {
            btn.classList.add('incorrect');
        }
    });

    if (isCorrect) {
        score++;
    }

    USER_ANSWERS.push({
        ...questionData,
        user_selected: selectedAnswer || "Skipped/Timeout"
    });
    
    if (selectedButton !== null) {
        nextQuestionBtn.disabled = false;
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestion();
    } else {
        endQuiz();
    }
}


// --- End Game and Results ---

function endQuiz() {
    clearInterval(timerInterval);
    
    progressBar.style.width = `100%`;
    progressText.textContent = `Quiz Complete!`;

    const summaryHTML = `
        <p><strong>Total Questions:</strong> ${questions.length}</p>
        <p><strong>Correct Answers:</strong> <strong style="color:#28a745;">${score}</strong></p>
        <p><strong>Incorrect Answers:</strong> <strong style="color:#dc3545;">${questions.length - score}</strong></p>
        <p><strong>Final Score:</strong> <strong style="font-size:1.2em;">${Math.round((score / questions.length) * 100)}%</strong></p>
    `;

    document.getElementById('final-summary').innerHTML = summaryHTML;
    showModal(resultsModal);
}

/**
 * Generates the review screen content and switches to it.
 */
function setupReviewScreen() {
    reviewContainer.innerHTML = '';
    let reviewHTML = '';

    USER_ANSWERS.forEach((item, index) => {
        const isCorrect = item.user_selected === item.correct_answer;
        const statusClass = isCorrect ? 'correct-status' : 'incorrect-status';
        const statusText = isCorrect ? 'Correct' : (item.user_selected === "Skipped/Timeout" ? 'Skipped' : 'Incorrect');

        reviewHTML += `
            <div class="review-item">
                <h3 class="review-q-title">Question ${index + 1}:</h3>
                <p class="review-question">${item.question}</p>
                <div class="review-details">
                    <p class="${statusClass}">Status: <strong>${statusText}</strong></p>
                    <p class="review-correct">Correct Answer: <strong>${item.correct_answer}</strong></p>
                    ${!isCorrect ? `<p class="review-user">Your Answer: <span class="${statusClass}">${item.user_selected}</span></p>` : ''}
                </div>
            </div>
        `;
    });

    reviewContainer.innerHTML = reviewHTML;
    hideModal(resultsModal);
    switchScreen(reviewScreen);
}

function resetToMenu() {
    clearInterval(timerInterval);
    hideModal(resultsModal);
    hideModal(confirmationModal);
    hideModal(previewModal);
    
    switchScreen(configScreen); 

    // Reset Quiz State and UI
    questionText.textContent = "Loading Question...";
    optionsContainer.innerHTML = '';
    progressBar.style.width = `0%`;
    progressText.textContent = `Question 0 of 0`;
}


// --- Event Listeners Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initial Theme Setup
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);

    // 2. Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });


    // 3. Config Form Submission -> Show Preview Modal
    document.getElementById('quiz-config-form').addEventListener('submit', (event) => {
        event.preventDefault(); 
        const categoryValue = document.getElementById('category').value;
        const difficultyValue = document.getElementById('difficulty').value;
        
        quizConfig = {
            amount: document.getElementById('num-questions').value,
            category: categoryValue === 'any' ? '' : categoryValue,
            difficulty: difficultyValue === '' ? '' : difficultyValue,
            type: document.getElementById('type').value,
        };

        const summaryHTML = `
            <p><strong>Questions:</strong> ${quizConfig.amount}</p>
            <p><strong>Category:</strong> ${getDisplayName('category', categoryValue)}</p>
            <p><strong>Difficulty:</strong> ${getDisplayName('difficulty', difficultyValue)}</p>
            <p><strong>Type:</strong> ${getDisplayName('type', quizConfig.type) || 'Any'}</p>
        `;
        document.getElementById('quiz-summary').innerHTML = summaryHTML;
        showModal(previewModal);
    });

    // 4. Start Quiz Button in Preview Modal (FIXED for repeated starts)
    startQuizBtn.addEventListener('click', () => {
        startQuizBtn.disabled = true; 
        
        let counter = 3;
        countdownDisplay.style.opacity = 1;
        
        // FIX: Display 3 immediately and start countdown from 2
        countdownDisplay.innerHTML = `<span class="countdown-pop">${counter}</span>`; 
        counter--;

        const countdownInterval = setInterval(() => {
            if (counter >= 0) {
                countdownDisplay.innerHTML = `<span class="countdown-pop">${counter === 0 ? 'GO!' : counter}</span>`;
                counter--;
            } else {
                clearInterval(countdownInterval);
                hideModal(previewModal);
                startQuizBtn.disabled = false;
                startNewGame(); // Start the game flow!
            }
        }, 1000);
    });
    cancelQuizBtn.addEventListener('click', () => hideModal(previewModal));


    // 5. Quiz Navigation and Exit
    nextQuestionBtn.addEventListener('click', nextQuestion);
    
    exitQuizBtn.addEventListener('click', () => {
        document.getElementById('confirmation-title').textContent = "End Quiz?";
        document.getElementById('confirmation-message').textContent = "Are you sure you want to exit? Your current progress and score will be lost.";
        confirmYesBtn.onclick = resetToMenu;
        showModal(confirmationModal);
    });
    
    confirmNoBtn.addEventListener('click', () => hideModal(confirmationModal));

    // 6. Results Modal Buttons
    exitToMenuBtn.addEventListener('click', resetToMenu);
    viewAnswersBtn.addEventListener('click', setupReviewScreen);
    
    // 7. Review Screen Button
    reviewToMenuBtn.addEventListener('click', resetToMenu);
});