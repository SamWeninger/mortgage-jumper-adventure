
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGame } from '@/contexts/GameContext';

interface AuthFormProps {
  onSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useGame();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      let success;
      
      if (isLogin) {
        success = await login(username, password);
      } else {
        success = await register(username, password);
      }
      
      if (success) {
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 w-full max-w-md mx-auto fade-in">
      <h2 className="text-2xl font-bold text-center mb-6 text-primary">
        {isLogin ? 'Login to Play' : 'Create an Account'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-control">
          <label htmlFor="username" className="form-label">Username</label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="form-input"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-control">
          <label htmlFor="password" className="form-label">Password</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="form-input"
            required
            disabled={isLoading}
          />
        </div>
        
        <Button 
          type="submit" 
          className="btn-game btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary hover:underline focus:outline-none"
          disabled={isLoading}
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
