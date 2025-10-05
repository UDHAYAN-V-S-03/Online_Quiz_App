# 🧠 Dynamic Online Quiz Application

A modern, responsive, and interactive web application for taking customizable quizzes powered by the Open Trivia Database API. Built with a focus on clean UX, accessibility, and lightweight performance.

## ✨ Features

* **Customizable Quizzes:** Users can select the **Number of Questions (5-30)**, **Category**, **Difficulty (Easy, Medium, Hard)**, and **Type (Multiple Choice, True/False)**.
* **Dynamic Data Fetching:** Questions are fetched in real-time from the **Open Trivia Database API**.
* **Interactive Game Loop:**
    * Countdown start sequence (3, 2, 1, GO!).
    * Per-question **15-second timer** with a visual progress bar.
    * Automatic advance to the next question upon timeout.
    * Instant visual feedback (Green for Correct, Red for Incorrect).
* **Progress Tracking:** Includes a real-time progress bar and question counter.
* **Detailed Review:** A final "View Answers" screen showing all questions, the user's selected answer, and the correct answer.
* **Theme Switching:** Persistent **Dark Mode** (default) and **Light Mode** toggle.
* **Responsive Design:** Optimized layout for mobile, tablet, and desktop viewing.

## 🛠️ Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Structure** | HTML5 | Semantic structure and screen layouts. |
| **Styling** | CSS3 | Responsive design, Flexbox/Grid, and Dark/Light theming via CSS Variables. |
| **Logic** | Vanilla JavaScript (ES6+) | Game state management, API handling, DOM manipulation, and timer control. |
| **Data Source**| Open Trivia DB API | Provides dynamic question content. |

## 🚀 Getting Started

To run this project locally, simply clone the repository and open the `index.html` file in your web browser.

```bash
# Clone the repository
git clone [https://github.com/YOUR_USERNAME/online-quiz-app.git](https://github.com/YOUR_USERNAME/online-quiz-app.git)

# Navigate to the project directory
cd online-quiz-app

# Open the main file
open index.html
