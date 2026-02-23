import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const History1 = () => {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/history/singleplayer`, {
            credentials: "include"
        })
            .then(res => res.json())
            .then(data => {
                setHistory(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching history:", err);
                setHistory([]);
                setLoading(false);
            });
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

  return (
    <main className="page-wrap">
      <section className="premium-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold card-title">Game History</h2>
            <p className="text-secondary mt-2">Review your past singleplayer runs.</p>
          </div>
          <Link to="/Quiz/Singleplayer" className="btn-secondary">Back to Quiz</Link>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="text-secondary">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="text-secondary">No game history yet. Start a quiz to see your results here!</p>
          ) : (
            <table className="leaderboard">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Topic</th>
                  <th>Rounds</th>
                  <th>Questions</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, index) => (
                  <tr key={index}>
                    <td className="capitalize font-semibold">{record.username || "Player"}</td>
                    <td className="capitalize">{record.topic}</td>
                    <td>{record.rounds}</td>
                    <td>{record.totalQuestions || "N/A"}</td>
                    <td className="card-title font-semibold">{record.score}</td>
                    <td className="text-secondary">{formatDate(record.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-secondary text-sm mt-4">Your quiz sessions are saved with scores, topic, and questions completed.</p>
      </section>
    </main>
  )
}

export default History1;
