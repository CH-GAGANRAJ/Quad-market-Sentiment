from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class NewsArticleBase(SQLModel):
    title: str
    source: str
    url: str
    published_at: datetime = Field(default_factory=datetime.utcnow)
    sentiment_score: float = 0.0
    ticker: str = Field(index=True)

class NewsArticle(NewsArticleBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # Adding a unique constraint logic or index on URL could be good, but user asked to check in logic.
    # We will index url for faster lookup.
    url: str = Field(index=True, unique=True) 

class SentimentScore(SQLModel):
    # This might be used for API responses or advanced analysis later
    ticker: str
    average_score: float
    article_count: int
