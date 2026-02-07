from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import uvicorn
import os

from database import get_db, init_db
from models import Quiz, Question
from scraper import scrape_wikipedia
from llm_service import generate_quiz_data

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the database
    print("Starting up and initializing database...")
    await init_db()
    yield
    # Shutdown: Clean up if needed
    print("Shutting down...")

app = FastAPI(title="AI Wiki Quiz Generator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-quiz")
async def generate_quiz(url: str, db: AsyncSession = Depends(get_db)):
    try:
        # Check if already exists to prevent duplicate scraping
        result = await db.execute(
            select(Quiz)
            .options(selectinload(Quiz.questions))
            .where(Quiz.url == url)
        )
        existing_quiz = result.scalars().first()
        if existing_quiz:
             print(f"Found existing quiz for URL: {url}")
             return existing_quiz

        # Scrape
        scraped_data = await scrape_wikipedia(url)
        
        # Generate LLM Data
        llm_data = await generate_quiz_data(scraped_data["title"], scraped_data["full_text"])
        
        # Save to DB
        new_quiz = Quiz(
            url=url,
            title=scraped_data["title"],
            summary=scraped_data["summary"],
            key_entities=llm_data["key_entities"],
            sections=scraped_data["sections"],
            related_topics=llm_data["related_topics"],
            raw_html=scraped_data["raw_html"]
        )
        db.add(new_quiz)
        await db.flush() # Get ID
        
        for q in llm_data["quiz"]:
            question = Question(
                quiz_id=new_quiz.id,
                question_text=q["question"],
                options=q["options"],
                answer=q["answer"],
                difficulty=q["difficulty"],
                explanation=q["explanation"]
            )
            db.add(question)
        
        await db.commit()
        await db.refresh(new_quiz)
        
        # Load questions for response
        result = await db.execute(
            select(Quiz)
            .options(selectinload(Quiz.questions))
            .where(Quiz.id == new_quiz.id)
        )
        return result.scalars().first()
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/quizzes")
async def list_quizzes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quiz).order_by(Quiz.created_at.desc()))
    return result.scalars().all()

@app.get("/quizzes/{id}")
async def get_quiz(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Quiz)
        .options(selectinload(Quiz.questions))
        .where(Quiz.id == id)
    )
    quiz = result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000))
    )