# MarketSentiment-Agent

A real-time pipeline that scrapes financial news, analyzes sentiment, and stores it for correlation with stock prices.

## Tech Stack
- **Language**: Python 3.10+
- **Framework**: FastAPI (Async)
- **Database**: PostgreSQL with SQLAlchemy (Async/Await) & SQLModel
- **Scraping**: Aiohttp + BeautifulSoup4
- **Sentiment**: NLTK/VADER
- **Frontend**: React + Vite + Tailwind CSS

## Setup & Running

### 1. Environment Setup
Install dependencies:
```bash
pip install -r requirements.txt
```

### 2. Database Setup
Start the PostgreSQL database using Docker:
```bash
docker-compose up -d
```
This will start a Postgres instance on port 5432 with the credentials specified in `.env` (default: `user:password`).

### 3. Run the Application
Start the FastAPI server:
```bash
uvicorn src.main:app --reload
```
The API will be available at `http://localhost:8000`.

## API Endpoints
- **GET** `/sentiment/{ticker}`: Returns average sentiment for the last 24 hours.
- **GET** `/articles/{ticker}`: Returns latest articles for a ticker.
- **POST** `/ingest`: Manually triggers the scraper task.

## Project Structure
- `src/config.py`: Configuration settings.
- `src/database.py`: Database connection and session management.
- `src/models.py`: Database models.
- `src/scraper`: RSS feed scraping and ingestion logic.
- `src/analyzer.py`: Sentiment analysis logic.
- `src/main.py`: FastAPI application entry point.

## Frontend (Dashboard)
The frontend is built with React, Vite, and Tailwind CSS.

### Setup
Navigate to the `frontend` directory and install dependencies:
```bash
cd frontend
npm install
```

### Running
Start the development server:
```bash
npm run dev
```
The dashboard will be available at `http://localhost:5173`.
