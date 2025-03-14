
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useGame } from '@/contexts/GameContext';
import { useToast } from "@/components/ui/use-toast";
import { Trophy, Clock } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  isVictory: boolean;
  isTimeUp?: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  isVictory, 
  isTimeUp = false,
  onRestart, 
  onMainMenu 
}) => {
  const { submitScore } = useGame();
  const { toast } = useToast();
  
  useEffect(() => {
    // Submit score on victory, but only once
    if (isVictory) {
      // Only submit the score once when the component mounts
      submitScore(score)
        .then((success) => {
          if (success) {
            toast({
              title: "Score Submitted",
              description: `Your score of ${formatScore()} has been recorded!`,
            });
          }
        })
        .catch((error) => {
          console.error("Error submitting score:", error);
        });
    }
  }, []);  // Empty dependency array ensures this runs only once

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
            <div className="flex justify-center mb-2">
              <Trophy className="h-10 w-10 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-primary">Stage Complete!</h2>
            <div className="py-4">
              <p className="text-lg mb-1">Your Score:</p>
              <p className="text-4xl font-bold text-accent">{formatScore()}</p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Your score has been submitted to the leaderboard.
            </p>
            
            <div className="space-y-4">
              <Button onClick={onRestart} className="btn-game btn-primary w-full">
                Play Again
              </Button>
              
              <Button onClick={onMainMenu} className="btn-game btn-secondary w-full">
                Return to Main Menu
              </Button>
            </div>
          </>
        ) : isTimeUp ? (
          <>
            <div className="flex justify-center mb-2">
              <Clock className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-destructive">Time's Up!</h2>
            <p className="text-lg mb-6">You ran out of time!</p>
            
            <div className="space-y-4">
              <Button onClick={onRestart} className="btn-game btn-primary w-full">
                Try Again
              </Button>
              
              <Button onClick={onMainMenu} className="btn-game btn-secondary w-full">
                Main Menu
              </Button>
            </div>
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
