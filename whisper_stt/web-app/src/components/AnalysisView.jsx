import './AnalysisView.css';

const AnalysisView = ({ analysis }) => {
    if (!analysis) return null;

    let data = analysis;
    if (typeof analysis === 'string') {
        try {
            data = JSON.parse(analysis);
        } catch (e) {
            console.error("Failed to parse analysis JSON", e);
            return <div className="error-panel">Error parsing analysis data</div>;
        }
    }

    const getScoreColor = (score) => {
        if (score >= 8) return 'text-green-400';
        if (score >= 5) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="analysis-container glass-panel animate-fade-in">
            <div className="analysis-header">
                <h3>📊 Deep Call Insights</h3>
                <span className={`sentiment-badge ${data.sentiment.toLowerCase()}`}>
                    {data.sentiment} Sentiment
                </span>
            </div>

            <div className="metrics-list">
                {/* Overall Score */}
                <div className="metric-row">
                    <div className="metric-main">
                        <label>Quality Score</label>
                        <div className={`score-value ${getScoreColor(data.overall_score)}`}>
                            {data.overall_score}/10
                        </div>
                    </div>
                    <div className="metric-feedback">
                        <p>💡 {data.overall_feedback}</p>
                    </div>
                </div>

                {/* Clarity */}
                <div className="metric-row">
                    <div className="metric-main">
                        <label>Clarity</label>
                        <div className="score-value">
                            {data.call_clarity}/10
                        </div>
                    </div>
                    <div className="metric-feedback">
                        <p>🗣️ {data.call_clarity_feedback}</p>
                    </div>
                </div>

                {/* Response Time */}
                <div className="metric-row">
                    <div className="metric-main">
                        <label>Response Time</label>
                        <div className="score-value text-blue-400">
                            {data.response_time_rating}
                        </div>
                    </div>
                    <div className="metric-feedback">
                        <p>⏱️ {data.response_time_feedback}</p>
                    </div>
                </div>
            </div>

            <div className="summary-section">
                <h4>Summary</h4>
                <p>{data.summary}</p>
            </div>
        </div>
    );
};

export default AnalysisView;
