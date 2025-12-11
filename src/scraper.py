import asyncio
import aiohttp
from bs4 import BeautifulSoup
from datetime import datetime
from email.utils import parsedate_to_datetime
from sqlalchemy.future import select
from src.database import get_session
from src.models import NewsArticle
from src.analyzer import calculate_sentiment
import logging

logger = logging.getLogger(__name__)

async def fetch_feed(session, url: str):
    try:
        async with session.get(url, timeout=10) as response:
            response.raise_for_status()
            return await response.text()
    except Exception as e:
        logger.error(f"Error fetching {url}: {e}")
        return None

async def process_feed(url: str, ticker: str):
    async with aiohttp.ClientSession() as http_session:
        content = await fetch_feed(http_session, url)
        if not content:
            return

        soup = BeautifulSoup(content, 'xml')
        items = soup.find_all('item')

        # We need a DB session
        async for db in get_session():
            for item in items:
                link = item.link.text.strip() if item.link else None
                if not link:
                    continue

                # Check for duplicates
                statement = select(NewsArticle).where(NewsArticle.url == link)
                results = await db.execute(statement)
                existing = results.scalars().first()
                if existing:
                    continue

                title = item.title.text.strip() if item.title else "No Title"
                pub_date_str = item.pubDate.text.strip() if item.pubDate else None
                published_at = datetime.utcnow()
                if pub_date_str:
                    try:
                        published_at = parsedate_to_datetime(pub_date_str)
                        # Ensure timezone naive/aware consistency if needed, assuming UTC or conversion
                        if published_at.tzinfo:
                            published_at = published_at.replace(tzinfo=None) # Simplification for example
                    except Exception:
                        pass
                
                # Sentiment
                score = calculate_sentiment(title)

                article = NewsArticle(
                    title=title,
                    source=url, # or parse domain
                    url=link,
                    published_at=published_at,
                    sentiment_score=score,
                    ticker=ticker
                )
                db.add(article)
            
            try:
                await db.commit()
            except Exception as e:
                logger.error(f"Error committing to DB: {e}")
                await db.rollback()

async def scrape_feeds(feeds: list[dict]):
    """
    feeds expected format: [{'url': '...', 'ticker': '...'}]
    """
    tasks = []
    for feed in feeds:
        tasks.append(process_feed(feed['url'], feed['ticker']))
    
    await asyncio.gather(*tasks)
