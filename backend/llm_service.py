import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

class QuizQuestion(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(description="Four options (A-D)")
    answer: str = Field(description="The correct answer (must be one of the options)")
    difficulty: str = Field(description="Difficulty level (easy, medium, hard)")
    explanation: str = Field(description="Short explanation of the answer")

class QuizOutput(BaseModel):
    key_entities: dict = Field(description="Extracted people, organizations, locations")
    quiz: List[QuizQuestion] = Field(description="List of 5-10 quiz questions")
    related_topics: List[str] = Field(description="Suggested related Wikipedia topics")

import asyncio

async def generate_quiz_data(article_title: str, article_text: str):
    # Comprehensive list of free-tier models (including newer versions and low-latency ones)
    models = [
        "gemini-3-flash-preview",
        "gemini-2.0-flash",     # Standard 2.0
        "gemini-2.0-flash-exp", # Experimental 2.0
        "gemini-1.5-flash",     # Standard 1.5
        "gemini-1.5-flash-8b",  # High-throughput small model
        "gemini-1.5-pro",       # Advanced model
        "gemini-1.0-pro"        # Legacy reliable model
    ]
    last_error = None

    for model_name in models:
        try:
            print(f"Attempting quiz generation with model: {model_name}")
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=os.getenv("GOOGLE_API_KEY"),
                temperature=0.7
            )

            prompt_template = ChatPromptTemplate.from_messages([
                ("system", "You are an expert educator and quiz creator. Your task is to generate a comprehensive quiz based on the provided Wikipedia article text."),
                ("user", """
                Article Title: {title}
                Article Text: {text}
                
                Generate a quiz with exactly 8 questions. Ensure variety in difficulty (approx 2 easy, 4 medium, 2 hard).
                The response must be in JSON format matching this schema:
                {{
                  "key_entities": {{
                    "people": ["name1", "name2"],
                    "organizations": ["org1", "org2"],
                    "locations": ["loc1", "loc2"]
                  }},
                  "quiz": [
                    {{
                      "question": "Question text?",
                      "options": ["Option A", "Option B", "Option C", "Option D"],
                      "answer": "Option B",
                      "difficulty": "medium",
                      "explanation": "Why this is correct..."
                    }}
                  ],
                  "related_topics": ["Topic 1", "Topic 2", "Topic 3"]
                }}
                
                Ground all questions in the provided text. Avoid hallucinations.
                """)
            ])

            chain = prompt_template | llm
            response = await chain.ainvoke({"title": article_title, "text": article_text})
            
            # Robustly handle content that might be a list or string
            content = response.content
            if isinstance(content, list):
                # Join parts if it's a list (sometimes happens with multimodal models)
                content = "".join([part.get("text", "") if isinstance(part, dict) else str(part) for part in content])
            
            content = str(content).strip()
            
            # Extract JSON more reliably using regex or splitting
            json_str = content
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            
            # Final attempt to find JSON-like structure if formatting is weird
            if not json_str.startswith("{"):
                start_idx = json_str.find("{")
                end_idx = json_str.rfind("}")
                if start_idx != -1 and end_idx != -1:
                    json_str = json_str[start_idx:end_idx+1]
                
            return json.loads(json_str)
        except Exception as e:
            error_str = str(e)
            print(f"Failed with model {model_name}: {error_str}")
            last_error = e
            
            # If it's a rate limit/quota error or something else, wait a bit
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                print("Quota hit or transient error, waiting 2 seconds before fallback...")
                await asyncio.sleep(2)
            
            continue

    raise Exception(f"All Gemini models failed. Possible Quota Issue or Invalid API Key. Last error: {str(last_error)}")
