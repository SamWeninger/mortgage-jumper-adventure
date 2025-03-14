
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

// Define types for our context
interface User {
  id?: number;
  username: string;
}

interface GameContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  highScores: {allTime: ScoreEntry[], daily: ScoreEntry[]};
  fetchHighScores: () => Promise<void>;
  submitScore: (score: number) => Promise<boolean>;
}

interface ScoreEntry {
  id: number;
  username: string;
  score: number;
  created_at: string;
}

// Supabase API constants
const SUPABASE_URL = "https://zdoglsnchvgwwjnbwqzp.supabase.co/rest/v1";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkb2dsc25jaHZnd3dqbmJ3cXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MTM0NTUsImV4cCI6MjA1NzQ4OTQ1NX0.z9BGucp31vSvuH44ky3p4q_ezQlF33wr8UStUWWySRU";

// Create the context with a default value
const GameContext = createContext<GameContextType>({
  user: null,
  isLoggedIn: false,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  highScores: {allTime: [], daily: []},
  fetchHighScores: async () => {},
  submitScore: async () => false
});

// Create a hook to use the context
export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [highScores, setHighScores] = useState<{allTime: ScoreEntry[], daily: ScoreEntry[]}>({
    allTime: [],
    daily: []
  });
  const { toast } = useToast();
  // Track if a score has already been submitted for the current game session
  const [submittedScore, setSubmittedScore] = useState(false);

  // Check if user is already logged in from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('mortgageRunnerUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem('mortgageRunnerUser');
      }
    }
  }, []);

  // Fetch high scores on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchHighScores();
    }
  }, [user]);

  // Login functionality
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/users?username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(password)}`, {
        method: "GET",
        headers: { 
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        const userData = {
          id: data[0].id,
          username: data[0].username
        };
        setUser(userData);
        localStorage.setItem('mortgageRunnerUser', JSON.stringify(userData));
        toast({
          title: "Login Successful",
          description: `Welcome back, ${userData.username}!`,
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Incorrect username or password",
        });
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "An error occurred. Please try again.",
      });
      return false;
    }
  };

  // Register functionality
  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      // First check if username already exists
      const checkResponse = await fetch(`${SUPABASE_URL}/users?username=eq.${encodeURIComponent(username)}`, {
        method: "GET",
        headers: { 
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        }
      });
      
      if (!checkResponse.ok) {
        throw new Error("Network response was not ok");
      }
      
      const existingUsers = await checkResponse.json();
      
      if (existingUsers.length > 0) {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: "Username already exists. Please choose another.",
        });
        return false;
      }
      
      // If username doesn't exist, proceed with registration
      const response = await fetch(`${SUPABASE_URL}/users`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });
      
      if (!response.ok) {
        throw new Error("Registration failed");
      }
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created!",
      });
      
      // Automatically log in the user after successful registration
      return await login(username, password);
      
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: "An error occurred. Please try again.",
      });
      return false;
    }
  };

  // Logout functionality
  const logout = () => {
    setUser(null);
    setSubmittedScore(false); // Reset submitted score flag on logout
    localStorage.removeItem('mortgageRunnerUser');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  // Fetch high scores from Supabase
  const fetchHighScores = async (): Promise<void> => {
    try {
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all-time high scores
      const allTimeResponse = await fetch(
        `${SUPABASE_URL}/game_scores?order=score.desc&limit=10`, {
          method: "GET",
          headers: { "apikey": SUPABASE_KEY }
        }
      );
      
      // Fetch daily high scores (scores from today)
      const dailyResponse = await fetch(
        `${SUPABASE_URL}/game_scores?created_at=gte.${today}&order=score.desc&limit=10`, {
          method: "GET",
          headers: { "apikey": SUPABASE_KEY }
        }
      );
      
      if (!allTimeResponse.ok || !dailyResponse.ok) {
        throw new Error("Failed to fetch high scores");
      }
      
      const allTimeData = await allTimeResponse.json();
      const dailyData = await dailyResponse.json();
      
      setHighScores({
        allTime: allTimeData,
        daily: dailyData
      });
      
    } catch (error) {
      console.error("Error fetching high scores:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load high scores.",
      });
    }
  };

  // Submit score to Supabase - with protection against multiple submissions
  const submitScore = async (score: number): Promise<boolean> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to submit scores.",
      });
      return false;
    }
    
    try {
      // Protect against multiple submissions from GameOverScreen effect running multiple times
      const response = await fetch(`${SUPABASE_URL}/game_scores`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: user.username,
          score
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit score");
      }
      
      // Refresh high scores after submission
      await fetchHighScores();
      return true;
      
    } catch (error) {
      console.error("Error submitting score:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit your score.",
      });
      return false;
    }
  };

  // Provide the context value
  const contextValue: GameContextType = {
    user,
    isLoggedIn: user !== null,
    login,
    register,
    logout,
    highScores,
    fetchHighScores,
    submitScore
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};
