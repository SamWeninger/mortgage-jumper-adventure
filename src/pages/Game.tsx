
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
      </div>
    </div>
  );
};

export default Game;
