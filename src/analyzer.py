import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Ensure lexicon is available
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon')

def calculate_sentiment(text: str) -> float:
    """
    Calculate sentiment score for the given text.
    Returns a float between -1.0 (negative) and 1.0 (positive).
    
    TODO: Replace this with OpenAI/Ollama API call for better context understanding.
    """
    sid = SentimentIntensityAnalyzer()
    scores = sid.polarity_scores(text)
    return scores['compound']
