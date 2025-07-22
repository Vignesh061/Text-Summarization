# app.py
from flask import Flask, render_template, request, jsonify
import nltk
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
from nltk.probability import FreqDist
from string import punctuation
import re
import os

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

app = Flask(__name__)

def summarize_text(text, num_points=10):
    # Tokenize the text into sentences
    sentences = sent_tokenize(text)
    
    if len(sentences) <= num_points:
        return sentences
    
    # Remove stopwords and punctuation to get the most meaningful words
    stop_words = set(stopwords.words('english') + list(punctuation))
    
    # Tokenize words, remove stopwords, and calculate word frequency
    words = []
    for sentence in sentences:
        words_in_sentence = [word.lower() for word in re.findall(r'\b\w+\b', sentence) 
                             if word.lower() not in stop_words and len(word) > 2]
        words.extend(words_in_sentence)
    
    # Calculate frequency distribution
    word_freq = FreqDist(words)
    
    # Score sentences based on word frequency
    sentence_scores = []
    for i, sentence in enumerate(sentences):
        score = 0
        words_in_sentence = [word.lower() for word in re.findall(r'\b\w+\b', sentence) 
                           if word.lower() not in stop_words and len(word) > 2]
        
        if words_in_sentence:
            for word in words_in_sentence:
                score += word_freq[word]
            
            # Normalize score by sentence length
            score /= len(words_in_sentence)
            
            # Give higher weight to sentences at the beginning
            if i < len(sentences) * 0.2:
                score *= 1.25
        
        sentence_scores.append((i, score))
    
    # Sort sentences by score
    sentence_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Get the top N sentences by score
    top_indices = [idx for idx, _ in sentence_scores[:num_points]]
    top_indices.sort()  # Sort indices to maintain original order
    
    # Get the top sentences
    summary = [sentences[i] for i in top_indices]
    
    # Clean up sentences
    summary = [s.strip() for s in summary]
    
    return summary

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/summarize', methods=['POST'])
def summarize():
    text = request.form.get('text', '')
    num_points = int(request.form.get('num_points', 10))
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    summary_points = summarize_text(text, num_points)
    
    # Ensure all points are properly formatted
    formatted_points = []
    for point in summary_points:
        # Clean up the point
        point = point.strip()
        
        # Capitalize first letter if not already
        if point and point[0].islower():
            point = point[0].upper() + point[1:]
        
        # Add period if missing
        if point and not point[-1] in ['.', '!', '?']:
            point += '.'
            
        formatted_points.append(point)
    
    return jsonify({'summary': formatted_points})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)