import "./App.css";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App: React.FC = () => {
  const [word, setWord] = useState<string>('');
  const [similarWords, setSimilarWords] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [newWordAdded, setNewWordAdded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null); // State to hold statistics data

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (/^[a-zA-Z]+$/.test(inputValue) || inputValue === '') {
      setWord(inputValue);
      setError(null);
    } else {
      setError('Input must contain only letters');
    }
  };

  const fetchSimilarWords = async () => {
    setLoading(true);
    try {
      const response = await axios.get<{ similar: string[] }>(`/api/v1/similar?word=${word}`);
      setSimilarWords(response.data.similar);
    } catch (error) {
      console.error('Error fetching similar words:', error);
    }
    setLoading(false);
  };

  const addNewWord = async () => {
    setLoading(true);
    try {
      await axios.post('/api/v1/add-word', { word });
      setNewWordAdded(true);
      setWord('');
    } catch (error) {
      console.error('Error adding new word:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats(); // Fetch stats on component mount
  }, []); // Empty dependency array to run only once on mount

  return (
    <div className="container">
      <h1>Badatz Assignment</h1>
      <div className="input-container">
        <input
          type="text"
          value={word}
          onChange={handleInputChange}
          placeholder="Enter a word"
          className={error ? "error" : ""}
        />
        {error && <p className="error-message">{error}</p>}
      </div>
      {loading && <p>Loading...</p>}
      {similarWords.length > 0 && (
        <div>
          <h2>Similar Words:</h2>
          <ul>
            {similarWords.map((similarWord) => (
              <li className="similar-word" key={similarWord}>{similarWord}</li>
            ))}
          </ul>
        </div>
      )}
      {newWordAdded && (
        <p className="success-message">New word added successfully!</p>
      )}
      <div className="button-container">
        <button onClick={fetchSimilarWords} disabled={loading}>
          Find Similar Words
        </button>
        <button className="add-word-button" onClick={addNewWord} disabled={loading || !word}>
          Add Word
        </button>
        <button onClick={fetchStats} disabled={loading}>
          Get Stats
        </button>
      </div>
      {stats && (
        <div>
          <h2>Statistics:</h2>
          <p>Total Words: {stats.totalWords}</p>
          <p>Total Requests: {stats.totalRequests}</p>
          <p>Average Processing Time (ms): {stats.avgProcessingTimeMs}</p>
        </div>
      )}
    </div>
  );
};

export default App;
