import asyncio
from datetime import datetime, timedelta
from fastapi import FastAPI, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select
from sqlalchemy import func
from src.database import init_db, get_session
from src.models import NewsArticle
from src.scraper import scrape_feeds
from src.analyzer import calculate_sentiment # just to ensure model loading if not already
from contextlib import asynccontextmanager

# Simple list of feeds to scrape
FEEDS = [
    {"url": "https://feeds.content.dowjones.io/public/rss/mw_topstories", "ticker": "MARKET"},
    {"url": "https://cointelegraph.com/rss", "ticker": "BTC"},
    # Add more real feeds as needed
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    # Start background scheduler
    task = asyncio.create_task(scheduler())
    yield
    # Shutdown
    task.cancel()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def scheduler():
    while True:
        print("Running scheduled scrape...")
        await scrape_feeds(FEEDS)
        await asyncio.sleep(3600) # Run every hour

@app.post("/ingest")
async def ingest_data(background_tasks: BackgroundTasks):
    background_tasks.add_task(scrape_feeds, FEEDS)
    return {"message": "Ingestion started in background"}

@app.get("/sentiment/{ticker}")
async def get_sentiment(ticker: str, session = Depends(get_session)):
    cutoff = datetime.utcnow() - timedelta(hours=24)
    # Average sentiment for the ticker in the last 24 hours
    statement = select(func.avg(NewsArticle.sentiment_score)).where(
        NewsArticle.ticker == ticker,
        NewsArticle.published_at >= cutoff
    )
    result = await session.execute(statement)
    avg_score = result.scalar()
    
    return {
        "ticker": ticker,
        "average_sentiment_24h": avg_score if avg_score is not None else 0.0,
        "calculated_at": datetime.utcnow()
    }

@app.get("/articles/{ticker}")
async def get_articles(ticker: str, limit: int = 10, session = Depends(get_session)):
    statement = select(NewsArticle).where(NewsArticle.ticker == ticker).order_by(NewsArticle.published_at.desc()).limit(limit)
    result = await session.execute(statement)
    articles = result.scalars().all()
    return articles

@app.get("/")
async def root():
    return {"message": "MarketSentiment-Agent API is running"}
