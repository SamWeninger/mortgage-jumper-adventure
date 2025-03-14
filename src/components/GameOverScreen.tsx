
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useGame } from '@/contexts/GameContext';

interface GameOverScreenProps {
  score: number;
  isVictory: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  isVictory, 
  onRestart, 
  onMainMenu 
}) => {
  const { submitScore } = useGame();
  const [countdown, setCountdown] = useState(isVictory ? 3 : 0);
  
  useEffect(() => {
    // Submit score on victory
    if (isVictory) {
      submitScore(score);
      
      // Auto redirect countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            clearInterval(timer);
            onMainMenu();
          }
          return newCount;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isVictory, score, submitScore, onMainMenu]);

  const formatScore = () => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(score);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="glass-panel p-8 w-full max-w-sm mx-auto scale-in text-center">
        {isVictory ? (
          <>
            <h2 className="text-2xl font-bold mb-2 text-primary">Stage Complete!</h2>
            <div className="py-4">
              <p className="text-lg mb-1">Your Score:</p>
              <p className="text-4xl font-bold text-accent">{formatScore()}</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your score has been submitted to the leaderboard.
            </p>
            <p className="text-sm text-gray-600">
              Returning to main menu in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-destructive">Game Over!</h2>
            <p className="text-lg mb-6">You went broke!</p>
            
            <div className="space-y-4">
              <Button onClick={onRestart} className="btn-game btn-primary w-full">
                Try Again
              </Button>
              
              <Button onClick={onMainMenu} className="btn-game btn-secondary w-full">
                Main Menu
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameOverScreen;
