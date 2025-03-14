
import React from 'react';
import { DollarSign, Package, ShoppingBag, TrendingDown, Clock } from 'lucide-react';

interface GameLegendProps {
  className?: string;
}

const GameLegend: React.FC<GameLegendProps> = ({ className = "" }) => {
  return (
    <div className={`text-sm text-gray-700 max-w-lg w-full ${className}`}>
      <div className="glass-panel p-4">
        <h3 className="font-semibold text-lg mb-3">Game Elements:</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <div className="bg-yellow-400 p-1 rounded-full">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <span>Coins (+$100)</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-purple-600 p-1 rounded-full">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span>Mystery Boxes (+$250 to $1,000)</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-orange-500 p-1 rounded-full">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <span>Luxury Purchases (-$500)</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-red-500 p-1 rounded-full">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <span>Market Crashes (-$1,000)</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-gray-700 p-1 rounded-full">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span>100 second time limit</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="bg-white/50 rounded-lg p-3 text-center">
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

export default GameLegend;
