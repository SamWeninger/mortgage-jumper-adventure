
import React from 'react';

interface Score {
  id: number;
  username: string;
  score: number;
  created_at: string;
}

interface LeaderboardTableProps {
  scores: Score[];
  minimal?: boolean;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ scores, minimal = false }) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format score as currency
  const formatScore = (score: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(score);
  };

  if (scores.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 italic">
        No scores recorded yet
      </div>
    );
  }

  return (
    <table className="leaderboard-table">
      <thead>
        <tr>
          <th className="w-12 rounded-tl-lg">Rank</th>
          <th>Player</th>
          <th className="text-right">Score</th>
          {!minimal && <th className="text-right rounded-tr-lg">Date</th>}
        </tr>
      </thead>
      <tbody>
        {scores.map((score, index) => (
          <tr key={score.id} className={index === 0 ? "bg-accent/10" : ""}>
            <td className="font-medium">
              {index === 0 ? (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-accent text-white rounded-full">
                  1
                </span>
              ) : (
                `#${index + 1}`
              )}
            </td>
            <td>{score.username}</td>
            <td className="text-right font-medium">{formatScore(score.score)}</td>
            {!minimal && <td className="text-right text-gray-500">{formatDate(score.created_at)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default LeaderboardTable;
