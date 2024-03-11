import "./App.css";
import React, { useState } from "react";
import axios, { AxiosError } from "axios";

enum State {
  SIMILAR,
  ADD_WORD,
  STATS,
  NONE
}

const App: React.FC = () => {
  const [word, setWord] = useState<string>("");
  const [similarWords, setSimilarWords] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [addWordMessage, setAddWordMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [state, setState] = useState<State>(State.NONE);
  
  const isValidWord = (word: string) => {
    return /^[a-zA-Z]+$/.test(word) || word === "";
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setWord(inputValue);
    if (isValidWord(inputValue)) {
      setError(null);
    } else {
      setError("Input must contain only letters");
      setState(State.NONE);
    }
  };

  const fetchSimilarWords = async () => {
    setLoading(true);
    try {
      const response = await axios.get<{ similar: string[] }>(
        `/api/v1/similar?word=${word}`
      );
      setSimilarWords(response.data.similar);
      setState(State.SIMILAR);
    } catch (error) {
      console.error("Error fetching similar words:", error);
      setState(State.NONE);
    }
    setLoading(false);
  };

  const addNewWord = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/v1/add-word", { word });
      setAddWordMessage(response.data);
      setState(State.ADD_WORD);
      setWord("");
    } catch (error: any) {
      setError(error.response.data.error);
      setState(State.NONE);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/v1/stats");
      setStats(response.data);
      setState(State.STATS);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setState(State.NONE);
    }
    setLoading(false);
  };

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
      {state === State.SIMILAR && similarWords.length > 0 && (
        <div>
          <h2>Similar Words:</h2>
          <ul>
            {similarWords.map((similarWord) => (
              <li className="similar-word" key={similarWord}>
                {similarWord}
              </li>
            ))}
          </ul>
        </div>
      )}
      {state === State.ADD_WORD && (
        <p className="success-message">{addWordMessage}</p>
      )}
      <div className="button-container">
        <button onClick={fetchSimilarWords} disabled={loading}>
          Find Similar Words
        </button>
        <button
          className="add-word-button"
          onClick={addNewWord}
          disabled={loading || !isValidWord(word)}
        >
          Add Word
        </button>
        <button onClick={fetchStats} disabled={loading}>
          Get Stats
        </button>
      </div>
      {state === State.STATS && (
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
