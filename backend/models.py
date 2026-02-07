from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    title = Column(String)
    summary = Column(Text)
    key_entities = Column(JSON) # {people: [], organizations: [], locations: []}
    sections = Column(JSON) # List of section titles
    related_topics = Column(JSON) # List of strings
    raw_html = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("Question", back_populates="quiz")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question_text = Column(Text)
    options = Column(JSON) # List of 4 strings
    answer = Column(String)
    difficulty = Column(String)
    explanation = Column(Text)

    quiz = relationship("Quiz", back_populates="questions")
