
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeaderboardTable from '@/components/LeaderboardTable';
import { useGame } from '@/contexts/GameContext';

const Leaderboard = () => {
  const { isLoggedIn, highScores, fetchHighScores } = useGame();
  const navigate = useNavigate();
  
  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    } else {
      // Refresh high scores when viewing leaderboard
      fetchHighScores();
    }
  }, [isLoggedIn, navigate, fetchHighScores]);
  
  if (!isLoggedIn) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <div className="game-container px-4 py-8">
      <div className="w-full max-w-4xl mx-auto fade-in">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Leaderboard</h1>
          <Button 
            onClick={() => navigate('/')} 
            className="btn-game btn-secondary"
          >
            Back to Menu
          </Button>
        </div>
        
        <div className="glass-panel p-6">
          <Tabs defaultValue="all-time">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="all-time">All-Time Best</TabsTrigger>
              <TabsTrigger value="daily">Today's Best</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-time" className="p-4 bg-white/50 rounded-lg">
              <h2 className="text-xl font-semibold text-primary mb-4">All-Time Highest Scores</h2>
              <LeaderboardTable scores={highScores.allTime} />
            </TabsContent>
            
            <TabsContent value="daily" className="p-4 bg-white/50 rounded-lg">
              <h2 className="text-xl font-semibold text-primary mb-4">Today's Highest Scores</h2>
              <LeaderboardTable scores={highScores.daily} />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Think you can top the leaderboard? Challenge yourself to earn a high score!
          </p>
          <Button 
            onClick={() => navigate('/game')} 
            className="btn-game btn-primary"
          >
            Play Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
