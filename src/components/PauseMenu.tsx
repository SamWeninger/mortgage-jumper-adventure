
import React from 'react';
import { Button } from "@/components/ui/button";

interface PauseMenuProps {
  onResume: () => void;
  onRestart?: () => void;
  onExit: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, onExit }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="glass-panel p-8 w-full max-w-sm mx-auto scale-in">
        <h2 className="text-2xl font-bold text-center mb-6 text-primary">Game Paused</h2>
        
        <div className="space-y-4">
          <Button onClick={onResume} className="btn-game btn-primary w-full">
            Resume
          </Button>
          
          {onRestart && (
            <Button onClick={onRestart} className="btn-game btn-secondary w-full">
              Restart Game
            </Button>
          )}
          
          <Button onClick={onExit} className="btn-game bg-gray-200 text-gray-700 hover:bg-gray-300 w-full">
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu;
