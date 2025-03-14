
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PauseMenu from './PauseMenu';
import GameOverScreen from './GameOverScreen';

// Game sprites and assets would be imported here in a real implementation
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;

interface GameEngineProps {
  onExit: () => void;
}

// Define the finishLine type
interface FinishLine {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GameEngine: React.FC<GameEngineProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const navigate = useNavigate();
  
  // Game state
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [money, setMoney] = useState(1000); // Starting money
  const [score, setScore] = useState(0);
  
  // Game elements
  const [gameState, setGameState] = useState({
    player: {
      x: 50,
      y: GAME_HEIGHT - 80,
      width: 40,
      height: 60,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      isDucking: false
    },
    platforms: [
      { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH * 3, height: 20 }
    ],
    coins: [] as any[],
    powerups: [] as any[],
    enemies: [] as any[],
    finishLine: {
      x: GAME_WIDTH * 3 - 100,
      y: GAME_HEIGHT - 80,
      width: 50,
      height: 60
    } as FinishLine,
    camera: {
      x: 0,
      y: 0
    },
    levelLength: GAME_WIDTH * 3,
    gravity: 0.6,
    background: {
      far: { x: 0 },
      mid: { x: 0 },
      near: { x: 0 }
    }
  });
  
  // Keyboard state
  const keys = useRef({
    left: false,
    right: false,
    up: false,
    down: false
  });
  
  // Initialize game
  useEffect(() => {
    console.log("Game initializing...");
    if (!canvasRef.current) {
      console.error("Canvas ref is null!");
      return;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      console.error("Canvas context is null!");
      return;
    }
    
    console.log("Generating level...");
    // Generate level
    generateLevel();
    
    console.log("Starting game loop...");
    // Start game loop
    startGameLoop();
    
    console.log("Setting up event listeners...");
    // Handle keyboard events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      console.log("Cleaning up game resources...");
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle game restart
  const restartGame = () => {
    console.log("Restarting game...");
    setMoney(1000);
    setScore(0);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    
    // Reset game state
    generateLevel();
    
    // Restart game loop
    startGameLoop();
  };
  
  // Generate game level with platforms, coins, powerups, and enemies
  const generateLevel = () => {
    console.log("Generating game level...");
    const platforms = [
      // Ground platform
      { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH * 3, height: 20 }
    ];
    
    // Add some elevated platforms
    for (let i = 0; i < 10; i++) {
      const x = 300 + i * 250 + Math.random() * 100;
      const y = GAME_HEIGHT - 100 - Math.random() * 100;
      const width = 80 + Math.random() * 120;
      platforms.push({ x, y, width, height: 20 });
    }
    
    // Add gaps in the ground
    for (let i = 0; i < 5; i++) {
      const x = 500 + i * 400 + Math.random() * 200;
      const width = 60 + Math.random() * 80;
      
      // Remove part of the ground platform for the gap
      platforms[0] = { ...platforms[0], width: x - platforms[0].x };
      
      // Add ground platform after the gap
      platforms.push({
        x: x + width,
        y: GAME_HEIGHT - 20,
        width: platforms[0].width + GAME_WIDTH * 3 - (x + width),
        height: 20
      });
    }
    
    // Generate coins
    const coins = [];
    for (let i = 0; i < 40; i++) {
      const x = 200 + i * 120 + Math.random() * 80;
      const y = GAME_HEIGHT - 60 - Math.random() * 120;
      coins.push({ x, y, width: 20, height: 20, value: 100, collected: false });
    }
    
    // Generate powerups (mystery boxes)
    const powerups = [];
    for (let i = 0; i < 8; i++) {
      const x = 350 + i * 300 + Math.random() * 100;
      const y = GAME_HEIGHT - 80 - Math.random() * 100;
      const value = 250 + Math.floor(Math.random() * 750); // Random value between 250 and 1000
      powerups.push({ x, y, width: 30, height: 30, value, collected: false });
    }
    
    // Generate enemies
    const enemies = [];
    // Luxury Purchases (stationary)
    for (let i = 0; i < 6; i++) {
      const x = 300 + i * 400 + Math.random() * 200;
      const y = GAME_HEIGHT - 60;
      enemies.push({ 
        x, y, width: 40, height: 40, 
        type: 'luxury', value: 500, 
        velocityX: 0, hit: false 
      });
    }
    
    // Market Crashes (moving)
    for (let i = 0; i < 4; i++) {
      const x = 600 + i * 550 + Math.random() * 200;
      const y = GAME_HEIGHT - 60;
      enemies.push({ 
        x, y, width: 50, height: 50, 
        type: 'crash', value: 1000, 
        velocityX: -1 - Math.random(), hit: false,
        startX: x, range: 100 + Math.random() * 100
      });
    }
    
    // Set the finish line
    const finishLine = { 
      x: GAME_WIDTH * 3 - 100, 
      y: GAME_HEIGHT - 80, 
      width: 50, 
      height: 60 
    };
    
    console.log("Level generation complete");
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      platforms,
      coins,
      powerups,
      enemies,
      finishLine,
      player: {
        ...prev.player,
        x: 50,
        y: GAME_HEIGHT - 80,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        isDucking: false
      },
      camera: { x: 0, y: 0 },
      levelLength: GAME_WIDTH * 3
    }));
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isPaused || isGameOver) return;
    
    console.log("Key down:", e.key);
    
    // Game controls
    switch(e.key) {
      case 'ArrowLeft':
        keys.current.left = true;
        console.log("Left key pressed, keys state:", keys.current);
        break;
      case 'ArrowRight':
        keys.current.right = true;
        console.log("Right key pressed, keys state:", keys.current);
        break;
      case 'ArrowUp':
        keys.current.up = true;
        console.log("Up key pressed, keys state:", keys.current);
        break;
      case 'ArrowDown':
        keys.current.down = true;
        console.log("Down key pressed, keys state:", keys.current);
        break;
      case 'p':
      case 'P':
        setIsPaused(true);
        console.log("Game paused");
        break;
    }
  };
  
  const handleKeyUp = (e: KeyboardEvent) => {
    console.log("Key up:", e.key);
    
    // Game controls
    switch(e.key) {
      case 'ArrowLeft':
        keys.current.left = false;
        break;
      case 'ArrowRight':
        keys.current.right = false;
        break;
      case 'ArrowUp':
        keys.current.up = false;
        break;
      case 'ArrowDown':
        keys.current.down = false;
        break;
    }
    
    console.log("Keys state after keyup:", keys.current);
  };
  
  // Start game loop
  const startGameLoop = () => {
    console.log("Game loop starting...");
    let lastTime = 0;
    
    const animate = (time: number) => {
      if (!canvasRef.current) {
        console.error("Canvas ref lost during animation loop");
        return;
      }
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        console.error("Canvas context lost during animation loop");
        return;
      }
      
      // Calculate delta time for smooth animations
      const deltaTime = lastTime ? (time - lastTime) / 16 : 1;
      lastTime = time;
      
      if (!isPaused && !isGameOver) {
        // Update game state
        updateGameState(deltaTime);
        
        // Draw game
        drawGame(ctx);
        
        // Check game over conditions
        checkGameOver();
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    console.log("Animation frame requested");
  };
  
  // Update game state
  const updateGameState = (deltaTime: number) => {
    // Update player movement
    updatePlayerMovement(deltaTime);
    
    // Update camera position
    updateCamera();
    
    // Update enemies
    updateEnemies(deltaTime);
    
    // Check collisions
    checkCollisions();
    
    // Check if player reached the finish line
    checkFinish();
  };
  
  // Update player movement
  const updatePlayerMovement = (deltaTime: number) => {
    setGameState(prev => {
      const player = { ...prev.player };
      
      // Debug player state before update
      console.log("Player before update:", 
        { x: player.x, y: player.y, vx: player.velocityX, vy: player.velocityY, isJumping: player.isJumping });
      console.log("Keys state:", keys.current);
      
      // Horizontal movement
      if (keys.current.left) {
        player.velocityX = -5 * deltaTime;
        console.log("Moving left, new velocityX:", player.velocityX);
      } else if (keys.current.right) {
        player.velocityX = 5 * deltaTime;
        console.log("Moving right, new velocityX:", player.velocityX);
      } else {
        // Apply friction
        player.velocityX *= 0.8;
      }
      
      // Jumping
      if (keys.current.up && !player.isJumping) {
        player.velocityY = -15;
        player.isJumping = true;
        console.log("Jumping, new velocityY:", player.velocityY);
      }
      
      // Ducking
      player.isDucking = keys.current.down;
      if (player.isDucking) {
        player.height = 30; // Reduce height when ducking
        console.log("Ducking, height reduced");
      } else {
        player.height = 60; // Normal height
      }
      
      // Apply gravity
      player.velocityY += prev.gravity * deltaTime;
      
      // Update position
      player.x += player.velocityX;
      player.y += player.velocityY;
      
      // Debug player state after update
      console.log("Player after update:", 
        { x: player.x, y: player.y, vx: player.velocityX, vy: player.velocityY, isJumping: player.isJumping });
      
      // Boundary checks
      if (player.x < 0) player.x = 0;
      if (player.x > prev.levelLength - player.width) {
        player.x = prev.levelLength - player.width;
      }
      
      return { ...prev, player };
    });
  };
  
  // Update camera position to follow player
  const updateCamera = () => {
    setGameState(prev => {
      const camera = { ...prev.camera };
      
      // Camera follows player with some margin
      camera.x = prev.player.x - GAME_WIDTH / 3;
      
      // Camera boundaries
      if (camera.x < 0) camera.x = 0;
      if (camera.x > prev.levelLength - GAME_WIDTH) {
        camera.x = prev.levelLength - GAME_WIDTH;
      }
      
      // Update parallax backgrounds
      const background = {
        far: { x: camera.x * 0.2 },
        mid: { x: camera.x * 0.5 },
        near: { x: camera.x * 0.8 }
      };
      
      return { ...prev, camera, background };
    });
  };
  
  // Update enemies
  const updateEnemies = (deltaTime: number) => {
    setGameState(prev => {
      const enemies = prev.enemies.map(enemy => {
        if (enemy.type === 'crash') {
          // Market crash enemies move back and forth
          enemy.x += enemy.velocityX * deltaTime;
          
          // Reverse direction if reached range limit
          if (enemy.x < enemy.startX - enemy.range || enemy.x > enemy.startX) {
            enemy.velocityX *= -1;
          }
        }
        return enemy;
      });
      
      return { ...prev, enemies };
    });
  };
  
  // Check for collisions
  const checkCollisions = () => {
    setGameState(prev => {
      const player = { ...prev.player };
      const coins = [...prev.coins];
      const powerups = [...prev.powerups];
      const enemies = [...prev.enemies];
      let newMoney = money;
      let newScore = score;
      
      // Check platform collisions (ground and platforms)
      let isOnPlatform = false;
      prev.platforms.forEach(platform => {
        // Check if player is on platform
        if (
          player.x + player.width > platform.x &&
          player.x < platform.x + platform.width &&
          player.y + player.height >= platform.y &&
          player.y + player.height <= platform.y + platform.height &&
          player.velocityY > 0
        ) {
          player.y = platform.y - player.height;
          player.velocityY = 0;
          player.isJumping = false;
          isOnPlatform = true;
          console.log("Player landed on platform");
        }
      });
      
      if (!isOnPlatform) {
        player.isJumping = true;
      }
      
      // Check coin collisions
      coins.forEach((coin, index) => {
        if (!coin.collected && checkObjectCollision(player, coin)) {
          coins[index] = { ...coin, collected: true };
          newMoney += coin.value;
          newScore += coin.value;
          setMoney(newMoney);
          setScore(newScore);
          console.log(`Coin collected! Money: ${newMoney}, Score: ${newScore}`);
        }
      });
      
      // Check powerup collisions
      powerups.forEach((powerup, index) => {
        if (!powerup.collected && checkObjectCollision(player, powerup)) {
          powerups[index] = { ...powerup, collected: true };
          newMoney += powerup.value;
          newScore += powerup.value;
          setMoney(newMoney);
          setScore(newScore);
          console.log(`Powerup collected! Money: ${newMoney}, Score: ${newScore}`);
        }
      });
      
      // Check enemy collisions
      enemies.forEach((enemy, index) => {
        if (!enemy.hit && checkObjectCollision(player, enemy)) {
          enemies[index] = { ...enemy, hit: true };
          newMoney -= enemy.value;
          setMoney(newMoney);
          console.log(`Hit enemy! Money reduced to: ${newMoney}`);
        }
      });
      
      return { ...prev, player, coins, powerups, enemies };
    });
  };
  
  // Helper to check collision between two objects
  const checkObjectCollision = (obj1: any, obj2: any) => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  };
  
  // Check if player reached the finish line
  const checkFinish = () => {
    if (gameState.finishLine && checkObjectCollision(gameState.player, gameState.finishLine)) {
      setIsGameOver(true);
      setIsVictory(true);
      console.log("Player reached finish line! Victory!");
    }
  };
  
  // Check game over conditions
  const checkGameOver = () => {
    // Check if player fell into a pit
    if (gameState.player.y > GAME_HEIGHT) {
      setIsGameOver(true);
      setIsVictory(false);
      console.log("Game over: Player fell into a pit");
    }
    
    // Check if player has no money left
    if (money <= 0) {
      setIsGameOver(true);
      setIsVictory(false);
      console.log("Game over: Player has no money left");
    }
  };
  
  // Draw game
  const drawGame = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw background (simplified)
    drawBackground(ctx);
    
    // Save context for camera transformation
    ctx.save();
    ctx.translate(-gameState.camera.x, 0);
    
    // Draw platforms
    drawPlatforms(ctx);
    
    // Draw coins
    drawCoins(ctx);
    
    // Draw powerups
    drawPowerups(ctx);
    
    // Draw enemies
    drawEnemies(ctx);
    
    // Draw finish line
    drawFinishLine(ctx);
    
    // Draw player
    drawPlayer(ctx);
    
    // Restore context
    ctx.restore();
    
    // Draw HUD on top (not affected by camera)
    drawHUD(ctx);
  };
  
  // Draw background layers
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Simple gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, "#87CEEB"); // Sky blue
    gradient.addColorStop(1, "#E0F7FA"); // Light cyan
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw mountains in the far background
    ctx.fillStyle = "#9E9E9E";
    for (let i = 0; i < 5; i++) {
      const x = (i * 200) - (gameState.background.far.x % 200);
      const height = 100 + Math.random() * 50;
      
      ctx.beginPath();
      ctx.moveTo(x - 100, GAME_HEIGHT);
      ctx.lineTo(x, GAME_HEIGHT - height);
      ctx.lineTo(x + 100, GAME_HEIGHT);
      ctx.fill();
    }
    
    // Draw hills in the mid background
    ctx.fillStyle = "#A5D6A7";
    for (let i = 0; i < 7; i++) {
      const x = (i * 150) - (gameState.background.mid.x % 150);
      const height = 60 + Math.random() * 30;
      
      ctx.beginPath();
      ctx.arc(x, GAME_HEIGHT + 30, 80, Math.PI, 0, false);
      ctx.fill();
    }
    
    // Draw clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (let i = 0; i < 8; i++) {
      const x = (i * 180) - (gameState.background.far.x % 180);
      const y = 40 + Math.random() * 50;
      
      // Cloud shape
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
      ctx.arc(x + 25, y + 5, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  // Draw platforms
  const drawPlatforms = (ctx: CanvasRenderingContext2D) => {
    gameState.platforms.forEach(platform => {
      // Platform gradient
      const gradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
      gradient.addColorStop(0, "#8D6E63"); // Brown
      gradient.addColorStop(1, "#5D4037"); // Darker brown
      
      ctx.fillStyle = gradient;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Platform top edge
      ctx.fillStyle = "#A1887F";
      ctx.fillRect(platform.x, platform.y, platform.width, 5);
      
      // Grass on top of ground platforms
      if (platform.y === GAME_HEIGHT - 20) {
        ctx.fillStyle = "#66BB6A";
        ctx.fillRect(platform.x, platform.y - 2, platform.width, 5);
      }
    });
  };
  
  // Draw coins
  const drawCoins = (ctx: CanvasRenderingContext2D) => {
    gameState.coins.forEach(coin => {
      if (!coin.collected) {
        // Coin circle
        ctx.fillStyle = "#FFD700"; // Gold
        ctx.beginPath();
        ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin highlight
        ctx.fillStyle = "#FFFFFF"; // White
        ctx.beginPath();
        ctx.arc(coin.x + coin.width / 3, coin.y + coin.height / 3, coin.width / 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin dollar sign
        ctx.fillStyle = "#8D6E63";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("$", coin.x + coin.width / 2, coin.y + coin.height / 1.8 + 4);
      }
    });
  };
  
  // Draw powerups (mystery boxes)
  const drawPowerups = (ctx: CanvasRenderingContext2D) => {
    gameState.powerups.forEach(powerup => {
      if (!powerup.collected) {
        // Mystery box
        ctx.fillStyle = "#673AB7"; // Purple
        ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
        
        // Question mark
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("?", powerup.x + powerup.width / 2, powerup.y + powerup.height / 1.5);
        
        // Box border
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(powerup.x, powerup.y, powerup.width, powerup.height);
      }
    });
  };
  
  // Draw enemies
  const drawEnemies = (ctx: CanvasRenderingContext2D) => {
    gameState.enemies.forEach(enemy => {
      if (!enemy.hit) {
        if (enemy.type === 'luxury') {
          // Luxury Purchase (bag with $ sign)
          ctx.fillStyle = "#FF5722"; // Deep orange
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          
          // Bag handle
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(enemy.x + 10, enemy.y);
          ctx.lineTo(enemy.x + 10, enemy.y - 10);
          ctx.lineTo(enemy.x + enemy.width - 10, enemy.y - 10);
          ctx.lineTo(enemy.x + enemy.width - 10, enemy.y);
          ctx.stroke();
          
          // Dollar sign
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 20px Arial";
          ctx.textAlign = "center";
          ctx.fillText("$", enemy.x + enemy.width / 2, enemy.y + enemy.height / 1.5);
        } else if (enemy.type === 'crash') {
          // Market Crash (down arrow)
          ctx.fillStyle = "#F44336"; // Red
          
          // Arrow body
          ctx.beginPath();
          ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height); // Arrow point
          ctx.lineTo(enemy.x, enemy.y); // Left corner
          ctx.lineTo(enemy.x + enemy.width, enemy.y); // Right corner
          ctx.closePath();
          ctx.fill();
          
          // Arrow stem
          ctx.fillRect(
            enemy.x + enemy.width / 2 - 5,
            enemy.y - 20,
            10,
            25
          );
        }
      }
    });
  };
  
  // Draw finish line
  const drawFinishLine = (ctx: CanvasRenderingContext2D) => {
    if (gameState.finishLine) {
      const { x, y, width, height } = gameState.finishLine;
      
      // Finish flag
      ctx.fillStyle = "#4CAF50"; // Green
      ctx.fillRect(x, y, width, height);
      
      // Flag pole
      ctx.fillStyle = "#795548"; // Brown
      ctx.fillRect(x, y, 5, height);
      
      // Checkered pattern
      ctx.fillStyle = "#FFFFFF"; // White
      const squareSize = 10;
      for (let i = 0; i < height / squareSize; i++) {
        for (let j = 0; j < width / squareSize; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(
              x + j * squareSize + 5,
              y + i * squareSize,
              squareSize,
              squareSize
            );
          }
        }
      }
    }
  };
  
  // Draw player
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    const { x, y, width, height, isDucking, isJumping } = gameState.player;
    
    // Player body
    ctx.fillStyle = "#2196F3"; // Blue
    ctx.fillRect(x, y, width, height);
    
    // Player face (different based on state)
    if (isDucking) {
      // Ducking face
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x + width - 15, y + 5, 10, 5);
    } else if (isJumping) {
      // Jumping face
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(x + width - 10, y + 15, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal face
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x + width - 15, y + 15, 10, 5);
    }
  };
  
  // Draw heads-up display (HUD)
  const drawHUD = (ctx: CanvasRenderingContext2D) => {
    // Money counter
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, 10, 150, 40);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Money:", 20, 32);
    
    ctx.fillStyle = money > 0 ? "#4CAF50" : "#F44336";
    ctx.font = "bold 18px Arial";
    ctx.fillText(`$${money}`, 90, 32);
    
    // Pause button
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(GAME_WIDTH - 50, 10, 40, 40);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("II", GAME_WIDTH - 30, 32);
    
    // Debug info in development
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, GAME_HEIGHT - 30, 300, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    const player = gameState.player;
    ctx.fillText(`x:${Math.round(player.x)} y:${Math.round(player.y)} vx:${player.velocityX.toFixed(2)} vy:${player.velocityY.toFixed(2)} jump:${player.isJumping}`, 15, GAME_HEIGHT - 15);
  };

  return (
    <div className="relative w-full flex justify-center">
      <canvas 
        ref={canvasRef} 
        width={GAME_WIDTH} 
        height={GAME_HEIGHT}
        id="game-canvas"
        onClick={(e) => {
          // Handle pause button click
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          if (x > GAME_WIDTH - 50 && x < GAME_WIDTH - 10 && y > 10 && y < 50) {
            setIsPaused(true);
          }
        }}
      />
      
      {/* Pause Menu */}
      {isPaused && !isGameOver && (
        <PauseMenu 
          onResume={() => setIsPaused(false)}
          onRestart={restartGame}
          onMainMenu={() => {
            cancelAnimationFrame(requestRef.current);
            onExit();
          }}
        />
      )}
      
      {/* Game Over Screen */}
      {isGameOver && (
        <GameOverScreen
          score={score}
          isVictory={isVictory}
          onRestart={restartGame}
          onMainMenu={() => {
            cancelAnimationFrame(requestRef.current);
            onExit();
          }}
        />
      )}
    </div>
  );
};

export default GameEngine;
