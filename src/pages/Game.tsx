
import React from 'react';
import { useNavigate } from 'react-router-dom';
import GameEngine from '@/components/GameEngine';
import { useGame } from '@/contexts/GameContext';

const Game = () => {
  const { isLoggedIn } = useGame();
  const navigate = useNavigate();
  
  // Redirect to login if not logged in
  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);
  
  if (!isLoggedIn) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <div className="game-container py-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="text-2xl font-bold text-primary mb-6">Mortgage Runner</h1>
        
        <GameEngine onExit={() => navigate('/')} />
        
        <div className="mt-6 text-sm text-gray-600 max-w-lg text-center">
          <p className="mb-2">
            <strong>Controls:</strong> Use arrow keys to move ← →, jump ↑, and duck ↓. Press P to pause.
          </p>
          <p>
            <strong>Goal:</strong> Collect coins, avoid debt, and reach the finish line with positive money!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Game;
