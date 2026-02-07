import asyncio
from database import engine
from sqlalchemy import select
from models import Quiz

async def check_db():
    async with engine.connect() as conn:
        result = await conn.execute(select(Quiz))
        rows = result.fetchall()
        print(f"Total quizzes in DB: {len(rows)}")
        for i, row in enumerate(rows):
            print(f"{i+1}: {row.title} ({row.url})")

if __name__ == "__main__":
    asyncio.run(check_db())
