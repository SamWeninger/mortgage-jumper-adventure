
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useGame } from '@/contexts/GameContext';
import LeaderboardTable from './LeaderboardTable';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, highScores } = useGame();

  return (
    <div className="w-full max-w-4xl mx-auto p-6 fade-in">
      <div className="text-center mb-10">
        <h1 className="game-title mb-4">Mortgage Runner</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Run, jump, and collect coins to pay off your mortgage before time runs out!
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Game controls section */}
        <div className="glass-panel p-6 flex-1">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-primary mb-2">Welcome, {user?.username}!</h2>
            <p className="text-sm text-gray-600">Ready to build your financial future?</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/game')} 
              className="btn-game btn-primary w-full"
            >
              Start Game
            </Button>
            
            <Button 
              onClick={() => navigate('/leaderboard')} 
              className="btn-game btn-secondary w-full"
            >
              View Leaderboard
            </Button>
            
            <Button 
              onClick={logout} 
              className="btn-game bg-gray-200 text-gray-700 hover:bg-gray-300 w-full"
            >
              Logout
            </Button>
          </div>
          
          <div className="mt-8">
            <h3 className="font-medium text-gray-700 mb-2">Game Controls:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center">
                <span className="inline-block bg-gray-200 px-2 py-1 rounded mr-2">←→</span>
                <span>Move left/right</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block bg-gray-200 px-2 py-1 rounded mr-2">↑</span>
                <span>Jump over obstacles</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block bg-gray-200 px-2 py-1 rounded mr-2">↓</span>
                <span>Duck under barriers</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block bg-gray-200 px-2 py-1 rounded mr-2">P</span>
                <span>Pause game</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Mini leaderboard section */}
        <div className="glass-panel p-6 flex-1">
          <h2 className="text-xl font-semibold text-primary text-center mb-6">Top Scores</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">All-Time Best</h3>
              <div className="bg-white/50 rounded-lg p-3">
                <LeaderboardTable scores={highScores.allTime.slice(0, 5)} minimal />
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Today's Best</h3>
              <div className="bg-white/50 rounded-lg p-3">
                <LeaderboardTable scores={highScores.daily.slice(0, 5)} minimal />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
