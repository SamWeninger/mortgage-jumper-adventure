
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="game-container flex flex-col items-center justify-center py-16">
      <div className="glass-panel p-8 max-w-md text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Oops! Page not found</p>
        
        <div className="max-w-xs mx-auto">
          <p className="text-gray-600 mb-6">
            Looks like you've fallen into a financial pitfall! Let's get you back on track.
          </p>
          
          <Button 
            onClick={() => navigate('/')} 
            className="btn-game btn-primary w-full"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
