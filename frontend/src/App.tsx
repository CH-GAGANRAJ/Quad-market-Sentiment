import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RefreshCw, TrendingUp, Newspaper, ExternalLink, Zap, Globe } from 'lucide-react';
import { cn } from './lib/utils';

const API_BASE = 'http://localhost:8000';

interface Article {
  title: string;
  source: string;
  url: string;
  published_at: string;
  sentiment_score: number;
}

interface SentimentData {
  ticker: string;
  average_sentiment_24h: number;
  calculated_at: string;
}

const TICKERS = ['MARKET', 'BTC', 'ETH', 'SPY', 'TSLA'];

function App() {
  const [activeTicker, setActiveTicker] = useState('MARKET');
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sentRes = await axios.get(`${API_BASE}/sentiment/${activeTicker}`);
      setSentiment(sentRes.data);
      const artRes = await axios.get(`${API_BASE}/articles/${activeTicker}`);
      setArticles(artRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [activeTicker]);

  const handleIngest = async () => {
    setIngesting(true);
    try {
      await axios.post(`${API_BASE}/ingest`);
      // Show toast or something? For now just log
      console.log("Ingestion started");
      setTimeout(() => fetchData(), 2000); // Refresh after a bit
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIngesting(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30 selection:text-primary-foreground font-sans overflow-hidden relative">
      {/* Background gradients */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-6xl">
        <header className="flex justify-between items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/20">
              <Activity className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Quad <span className="text-sm font-normal text-white/40 ml-2">Market Sentiment</span>
            </h1>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleIngest}
            disabled={ingesting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300",
              ingesting
                ? "bg-surface text-white/50 cursor-not-allowed"
                : "bg-surface hover:bg-surface/80 text-primary hover:shadow-lg hover:shadow-primary/10 border border-white/5"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", ingesting && "animate-spin")} />
            {ingesting ? "Syncing..." : "Ingest Data"}
          </motion.button>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar / Ticker Select */}
          <div className="md:col-span-3 space-y-2">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 px-2">Watchlist</h3>
            {TICKERS.map((t) => (
              <motion.button
                key={t}
                onClick={() => setActiveTicker(t)}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl transition-all duration-200 border border-transparent flex justify-between items-center group",
                  activeTicker === t
                    ? "bg-primary/10 text-primary border-primary/20 shadow-lg shadow-primary/5"
                    : "hover:bg-surface text-white/60 hover:text-white"
                )}
              >
                <span className="font-medium">{t}</span>
                {activeTicker === t && (
                  <motion.div layoutId="active-indicator" className="w-2 h-2 rounded-full bg-primary" />
                )}
              </motion.button>
            ))}
          </div>

          {/* Main Content */}
          <div className="md:col-span-9 space-y-6">

            {/* Sentiment Hero Card */}
            <motion.div
              layout
              className="relative overflow-hidden rounded-3xl bg-surface border border-white/5 p-8 shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-4xl font-bold mb-1">{activeTicker}</h2>
                    <p className="text-white/40">24h Sentiment Analysis</p>
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium border",
                    sentiment && sentiment.average_sentiment_24h > 0
                      ? "bg-secondary/10 text-secondary border-secondary/20"
                      : sentiment && sentiment.average_sentiment_24h < 0
                        ? "bg-accent/10 text-accent border-accent/20"
                        : "bg-white/5 text-white/40 border-white/10"
                  )}>
                    {sentiment?.average_sentiment_24h.toFixed(2) || "0.00"} Score
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Gauge Visualization (Simplified) */}
                  <div className="col-span-2 space-y-4">
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden flex relative">
                      {/* Center Marker */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10" />

                      <motion.div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          (sentiment?.average_sentiment_24h || 0) > 0 ? "bg-secondary" : "bg-accent"
                        )}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.abs(sentiment?.average_sentiment_24h || 0) * 100}%`,
                          x: (sentiment?.average_sentiment_24h || 0) > 0 ? '50%' : `${50 - Math.abs(sentiment?.average_sentiment_24h || 0) * 100}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/30 font-medium uppercase tracking-wide">
                      <span>Negative</span>
                      <span>Neutral</span>
                      <span>Positive</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 justify-center items-start pl-6 border-l border-white/5">
                    <div className="flex items-center gap-2 text-white/60">
                      {loading ? <Zap className="w-4 h-4 animate-pulse" /> : <TrendingUp className="w-4 h-4" />}
                      <span>Analyzed Articles</span>
                    </div>
                    <span className="text-2xl font-bold">{articles.length}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Articles Feed */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-primary" />
                Latest Coverage
              </h3>

              <div className="grid gap-3">
                <AnimatePresence mode='wait'>
                  {loading && articles.length === 0 ? (
                    <div className="py-12 text-center text-white/30">Loading analysis...</div>
                  ) : articles.length > 0 ? (
                    articles.map((article, i) => (
                      <motion.a
                        key={article.url + i}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group block p-5 rounded-2xl bg-surface/50 border border-white/5 hover:bg-surface hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-white/0 group-hover:to-white/5 transition-all duration-500" />
                        <div className="flex justify-between md:items-center flex-col md:flex-row gap-2 relative z-10">
                          <div>
                            <h4 className="font-semibold text-lg text-white/90 group-hover:text-primary transition-colors line-clamp-1">{article.title}</h4>
                            <div className="flex items-center gap-3 mt-2 text-sm text-white/40">
                              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {article.source}</span>
                              <span>•</span>
                              <span>{new Date(article.published_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "px-2 py-1 rounded text-xs font-bold",
                              article.sentiment_score > 0 ? "text-secondary bg-secondary/10" : "text-accent bg-accent/10"
                            )}>
                              {article.sentiment_score > 0 ? "+" : ""}{article.sentiment_score}
                            </div>
                            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-white/50" />
                          </div>
                        </div>
                      </motion.a>
                    ))
                  ) : (
                    <div className="py-12 text-center text-white/30 bg-surface/30 rounded-2xl border border-white/5 border-dashed">
                      No articles found for this ticker. Try ingesting data.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
