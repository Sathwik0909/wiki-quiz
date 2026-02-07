# AI Wiki Quiz Generator 🧠📝

DeepKlarity AI Wiki Quiz is a powerful tool that transforms any Wikipedia article into an interactive, high-quality quiz using Google Gemini AI.

## ✨ Features

- **Instant Generation**: Paste any Wikipedia URL and get a 10-question quiz in seconds.
- **Interactive Experience**: Take the quiz directly in the app with immediate feedback.
- **Smart Reveal**: Answers and article summaries are hidden until submission to prevent spoilers.
- **Detailed Explanations**: Every answer comes with AI-generated context for better learning.
- **Quiz History**: Track and retake your previous quizzes anytime.
- **Premium UI**: Modern dark theme with glassmorphism and smooth animations.

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion, Lucide React.
- **Backend**: Python, FastAPI, SQLAlchemy (Async), LangChain, Google Gemini API.
- **Storage**: **MySQL Database** (Robust persistent storage for all quizzes and history).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (3.9+)
- **MySQL Server**
- Google Gemini API Key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file from the template and add your API Key:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   DATABASE_URL=mysql+aiomysql://user:password@localhost/wikiquiz
   ```
4. Start the server:
   ```bash
   python main.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security

All API keys are managed via environment variables. Ensure your `.env` file is never committed to version control.

---

