
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '@/components/AuthForm';
import MainMenu from '@/components/MainMenu';
import { useGame } from '@/contexts/GameContext';

const Index = () => {
  const { isLoggedIn } = useGame();
  const navigate = useNavigate();
  
  const handleAuthSuccess = () => {
    // This function will be called when authentication is successful
    console.log("Authentication successful");
  };
  
  return (
    <div className="game-container px-4 py-8">
      {!isLoggedIn ? (
        <div className="w-full max-w-md mx-auto mt-16">
          <h1 className="game-title text-center mb-8">Mortgage Runner</h1>
          <AuthForm onSuccess={handleAuthSuccess} />
        </div>
      ) : (
        <MainMenu />
      )}
    </div>
  );
};

export default Index;
