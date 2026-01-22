import { useState } from 'react';
import './TranscriptionView.css';

const TranscriptionView = ({ text, fileName, onReset }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `transcription-${fileName}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="transcription-container glass-panel animate-fade-in">
            <div className="transcription-header">
                <div className="file-info">
                    <span className="icon">📄</span>
                    <span className="filename">{fileName}</span>
                </div>
                <div className="actions">
                    <button className="btn-secondary" onClick={handleDownload}>
                        Download
                    </button>
                    <button className={`btn-primary ${copied ? 'success' : ''}`} onClick={handleCopy}>
                        {copied ? 'Copied!' : 'Copy Text'}
                    </button>
                </div>
            </div>

            <div className="transcription-content-wrapper">
                <textarea
                    readOnly
                    value={text}
                    className="transcription-textarea"
                />
            </div>

            <div className="transcription-footer">
                <button className="btn-text" onClick={onReset}>
                    ← Transcribe another file
                </button>
            </div>
        </div>
    );
};

export default TranscriptionView;
