import httpx
from bs4 import BeautifulSoup
import re

async def scrape_wikipedia(url: str):
    headers = {
        "User-Agent": "WikiQuizGenerator/1.0 (https://github.com/yourusername/wiki-quiz-generator; contact@example.com) httpx/0.24"
    }
    async with httpx.AsyncClient(headers=headers) as client:
        response = await client.get(url, follow_redirects=True)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch Wikipedia page: {response.status_code}")
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove unwanted elements
        for element in soup(["script", "style", "table", "footer", "nav", "aside"]):
            element.decompose()

        title = soup.find(id="firstHeading").text.strip()
        
        # Get the summary (first few paragraphs)
        content_div = soup.find(id="mw-content-text").find(class_="mw-parser-output")
        paragraphs = content_div.find_all("p", recursive=False)
        
        summary_paragraphs = []
        for p in paragraphs:
            if p.text.strip():
                summary_paragraphs.append(p.text.strip())
            if len(summary_paragraphs) >= 3:
                break
        
        summary = "\n".join(summary_paragraphs)
        summary = re.sub(r'\[\d+\]', '', summary) # Remove citations
        
        # Get sections
        sections = []
        for h2 in content_div.find_all("h2", recursive=False):
            section_title = h2.find(class_="mw-headline")
            if section_title:
                sections.append(section_title.text.strip())
        
        # Extract full text for LLM (limit to avoid token issues)
        full_text = ""
        for p in paragraphs:
            full_text += p.text.strip() + " "
        full_text = re.sub(r'\[\d+\]', '', full_text)
        
        # Key Entities (Simple heuristic for now)
        # In a real app, you might use Spacy or another NLP tool.
        # Here we'll rely on the LLM to extract them from the text, 
        # but let's gather links as potential entities.
        links = content_div.find_all("a", href=re.compile(r"^/wiki/"))
        potential_entities = list(set([link.get("title") for link in links if link.get("title") and ":" not in link.get("href")]))[:20]

        return {
            "title": title,
            "summary": summary,
            "sections": sections,
            "full_text": full_text[:10000], # Limit to 10k chars
            "potential_entities": potential_entities,
            "raw_html": response.text
        }
