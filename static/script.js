document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputText = document.getElementById('input-text');
    const wordCounter = document.getElementById('word-counter');
    const charCounter = document.getElementById('char-counter');
    const summaryPointsSelect = document.getElementById('summary-points');
    const summarizeBtn = document.getElementById('summarize-btn');
    const summaryOutput = document.getElementById('summary-output');
    const summaryPlaceholder = document.getElementById('summary-placeholder');
    const loadingDiv = document.querySelector('.loading');
    const copyBtn = document.getElementById('copy-btn');
    const copyTooltip = document.getElementById('copy-tooltip');
    const summaryStats = document.getElementById('summary-stats');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Dark mode functionality
    let darkMode = localStorage.getItem('darkMode') === 'true';
    
    function updateTheme() {
        if (darkMode) {
            document.documentElement.style.setProperty('--background-light', '#1a1a2e');
            document.documentElement.style.setProperty('--background-white', '#16213e');
            document.documentElement.style.setProperty('--text-color', '#e6e6e6');
            document.documentElement.style.setProperty('--light-text', '#b8b8b8');
            document.documentElement.style.setProperty('--border-color', '#2c3651');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.documentElement.style.setProperty('--background-light', '#f8f9fa');
            document.documentElement.style.setProperty('--background-white', '#ffffff');
            document.documentElement.style.setProperty('--text-color', '#333');
            document.documentElement.style.setProperty('--light-text', '#666');
            document.documentElement.style.setProperty('--border-color', '#e1e1e1');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    themeToggle.addEventListener('click', () => {
        darkMode = !darkMode;
        localStorage.setItem('darkMode', darkMode);
        updateTheme();
    });
    
    // Initialize theme
    updateTheme();
    
    // Update word and character count
    inputText.addEventListener('input', () => {
        const text = inputText.value.trim();
        const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
        const charCount = text.length;
        
        wordCounter.textContent = `${wordCount} words`;
        charCounter.textContent = `${charCount} characters`;
    });
    
    // Copy to clipboard functionality
    copyBtn.addEventListener('click', () => {
        const summaryItems = Array.from(summaryOutput.querySelectorAll('li'));
        if (summaryItems.length === 0) return;
        
        const textToCopy = summaryItems.map(item => item.textContent).join('\n\n');
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyTooltip.style.opacity = '1';
            setTimeout(() => {
                copyTooltip.style.opacity = '0';
            }, 2000);
        });
    });
    
    // Summarize function
    function summarize() {
        const text = inputText.value.trim();
        
        if (!text) {
            alert('Please enter some text to summarize.');
            return;
        }
        
        const numPoints = parseInt(summaryPointsSelect.value);
        
        // Show loading indicator
        loadingDiv.style.display = 'block';
        summaryOutput.style.display = 'none';
        summaryPlaceholder.style.display = 'none';
        
        // Send request to the server
        const formData = new FormData();
        formData.append('text', text);
        formData.append('num_points', numPoints);
        
        fetch('/summarize', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Update the output
            summaryOutput.innerHTML = data.summary.map(point => `<li>${point}</li>`).join('');
            
            // Show summary and update stats
            summaryOutput.style.display = 'block';
            summaryPlaceholder.style.display = 'none';
            
            // Update summary stats
            const summaryWordCount = data.summary.join(' ').split(/\s+/).filter(Boolean).length;
            summaryStats.textContent = `${data.summary.length} points · ${summaryWordCount} words`;
        })
        .catch(error => {
            console.error('Error:', error);
            summaryOutput.innerHTML = '<li>Error generating summary. Please try again.</li>';
            summaryOutput.style.display = 'block';
            summaryPlaceholder.style.display = 'none';
        })
        .finally(() => {
            // Hide loading indicator
            loadingDiv.style.display = 'none';
        });
    }
    
    // Button click event
    summarizeBtn.addEventListener('click', summarize);
    
    // Allow Ctrl+Enter in textarea to trigger summarization
    inputText.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            summarize();
        }
    });
});