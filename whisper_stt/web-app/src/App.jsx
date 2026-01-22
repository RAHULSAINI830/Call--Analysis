import { useState } from 'react';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import AnalysisView from './components/AnalysisView';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setTranscription("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // 1. If VITE_API_URL is set (Render/External), use that.
      // 2. If PROD (Vercel), use relative /api path.
      // 3. Else Localhost.
      const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://127.0.0.1:8000");
      const cleanBase = baseUrl.replace(/\/$/, "");
      const apiUrl = `${cleanBase}/speech-to-text/`;

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setTranscription(data.transcription);
    } catch (err) {
      console.error(err);
      setError("Failed to transcribe audio. Please ensure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!transcription) return;

    setIsAnalyzing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://127.0.0.1:8000");
      const cleanBase = baseUrl.replace(/\/$/, "");
      const apiUrl = `${cleanBase}/analyze/`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcription }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Analysis failed");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error(err);
      setError("Analysis failed: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTranscription("");
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1>CLARA AI</h1>
        <p>Intelligent Call Analysis & Insights</p>
      </header>

      <main>
        {isLoading ? (
          <div className="loading-container glass-panel">
            <div className="spinner"></div>
            <p>Transcribing your audio...</p>
            <span className="sub-text">This may take a few moments depending on file size.</span>
          </div>
        ) : !transcription ? (
          <div className="upload-section">
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div className="results-section">
            <TranscriptionView
              text={transcription}
              fileName={file?.name}
              onReset={handleReset}
            />

            {!analysisResult && !isAnalyzing && (
              <div className="analyze-action" style={{ textAlign: 'center', marginTop: '20px' }}>
                <button className="btn-primary" onClick={handleAnalyze}>
                  ✨ Analyze Call Insights
                </button>
              </div>
            )}

            {isAnalyzing && (
              <div className="loading-container" style={{ padding: '2rem' }}>
                <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
                <p>Analyzing call sentiment and quality...</p>
              </div>
            )}

            {analysisResult && <AnalysisView analysis={analysisResult} />}
          </div>
        )}
      </main>

      <footer>
        <p>© 2024 CLARA AI • Powered by Advanced LLMs</p>
      </footer>
    </div>
  );
}

export default App;
