
import React, { useState, useCallback } from 'react';
import { summarizeArticle, textToSpeech } from './services/geminiService';
import AudioPlayer from './components/AudioPlayer';

type Status = 'idle' | 'summarizing' | 'generating_audio' | 'error' | 'success';

const StatusIndicator: React.FC<{ status: Status; errorMessage: string }> = ({ status, errorMessage }) => {
  if (status === 'idle' || status === 'success') return null;

  if (status === 'error') {
    return (
      <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
        <p className="font-bold">An Error Occurred</p>
        <p className="text-sm mt-1">{errorMessage}</p>
      </div>
    );
  }

  const messages = {
    summarizing: 'Reading and summarizing the article...',
    generating_audio: 'Creating your audio summary...',
  };

  return (
    <div className="mt-6 flex items-center justify-center p-4 bg-gray-800/60 rounded-lg">
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="text-gray-300">{messages[status as keyof typeof messages]}</span>
    </div>
  );
};

export default function App() {
  const [articleText, setArticleText] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [base64Audio, setBase64Audio] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleGenerate = useCallback(async () => {
    if (!articleText.trim()) {
      setErrorMessage('Please paste the article text before generating.');
      setStatus('error');
      return;
    }

    setStatus('summarizing');
    setSummary('');
    setBase64Audio(null);
    setErrorMessage('');

    try {
      const summaryResult = await summarizeArticle(articleText);
      setSummary(summaryResult);
      setStatus('generating_audio');

      const audioResult = await textToSpeech(summaryResult);
      setBase64Audio(audioResult);
      setStatus('success');

    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setErrorMessage(`Failed to generate audio summary. ${message}`);
      setStatus('error');
    }
  }, [articleText]);

  const isLoading = status === 'summarizing' || status === 'generating_audio';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            CommuteCast
          </h1>
          <p className="mt-2 text-lg text-gray-400">Your personalized audio news summary.</p>
        </header>

        <main className="bg-gray-800/50 p-6 sm:p-8 rounded-2xl shadow-2xl shadow-indigo-900/20 border border-gray-700">
          <div className="flex flex-col">
            <label htmlFor="article-input" className="mb-2 font-semibold text-gray-300">
              Paste your news article text below:
            </label>
            <textarea
              id="article-input"
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              placeholder="Start by pasting the full text of a news article here..."
              className="w-full h-48 p-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-y text-gray-200 placeholder-gray-500"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !articleText.trim()}
            className="mt-6 w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 group"
          >
            {isLoading ? 'Generating...' : 'Create Audio Summary'}
             <svg className={`w-5 h-5 ml-2 transition-transform duration-300 ${!isLoading ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </button>
          
          <StatusIndicator status={status} errorMessage={errorMessage} />
          
        </main>
        
        {status === 'success' && summary && base64Audio && (
          <section className="mt-8 bg-gray-800/50 p-6 sm:p-8 rounded-2xl shadow-2xl shadow-indigo-900/20 border border-gray-700 animate-fade-in">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-4">Your Summary</h2>
            <AudioPlayer base64Audio={base64Audio} />
            <p className="mt-6 text-gray-300 leading-relaxed whitespace-pre-wrap">{summary}</p>
          </section>
        )}
      </div>
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
