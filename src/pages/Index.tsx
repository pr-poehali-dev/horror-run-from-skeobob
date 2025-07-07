import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

const Index = () => {
  const [gameState, setGameState] = useState("menu"); // menu, playing, gameOver
  const [playerPos, setPlayerPos] = useState(50);
  const [skebobPos, setSkebobPos] = useState(10);
  const [isBlinded, setIsBlinded] = useState(false);
  const [blindCooldown, setBlindCooldown] = useState(0);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([1250, 980, 765, 432, 201]);
  const gameRef = useRef<HTMLDivElement>(null);
  const [keys, setKeys] = useState({ left: false, right: false });

  useEffect(() => {
    if (gameState === "playing") {
      const gameLoop = setInterval(() => {
        setScore((prev) => prev + 1);

        if (!isBlinded) {
          setSkebobPos((prev) => {
            const newPos = prev + (playerPos > prev ? 2 : -2);
            if (Math.abs(newPos - playerPos) < 5) {
              setGameState("gameOver");
            }
            return newPos;
          });
        }

        if (blindCooldown > 0) {
          setBlindCooldown((prev) => prev - 1);
        }
      }, 100);

      return () => clearInterval(gameLoop);
    }
  }, [gameState, playerPos, isBlinded, blindCooldown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setKeys((prev) => ({ ...prev, left: true }));
      if (e.key === "ArrowRight") setKeys((prev) => ({ ...prev, right: true }));
      if (e.key === " " && gameState === "playing") {
        e.preventDefault();
        blindSkebob();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setKeys((prev) => ({ ...prev, left: false }));
      if (e.key === "ArrowRight")
        setKeys((prev) => ({ ...prev, right: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, blindCooldown]);

  useEffect(() => {
    if (gameState === "playing") {
      const moveLoop = setInterval(() => {
        setPlayerPos((prev) => {
          let newPos = prev;
          if (keys.left && prev > 0) newPos = prev - 3;
          if (keys.right && prev < 100) newPos = prev + 3;
          return newPos;
        });
      }, 50);

      return () => clearInterval(moveLoop);
    }
  }, [keys, gameState]);

  const startGame = () => {
    setGameState("playing");
    setPlayerPos(50);
    setSkebobPos(10);
    setScore(0);
    setIsBlinded(false);
    setBlindCooldown(0);
  };

  const blindSkebob = () => {
    if (blindCooldown === 0) {
      setIsBlinded(true);
      setBlindCooldown(50);
      setTimeout(() => setIsBlinded(false), 3000);
    }
  };

  const backToMenu = () => {
    setGameState("menu");
    if (score > Math.min(...highScores)) {
      const newScores = [...highScores, score]
        .sort((a, b) => b - a)
        .slice(0, 5);
      setHighScores(newScores);
    }
  };

  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-black to-red-900 flex items-center justify-center text-white">
        <div className="text-center space-y-8 max-w-md">
          <h1
            className="text-6xl font-black tracking-wider mb-4"
            style={{ fontFamily: "Impact, sans-serif" }}
          >
            СКЕБОБ
          </h1>
          <p className="text-xl opacity-80 mb-8">ХОРРОР РАННЕР</p>

          <div className="space-y-4">
            <Button
              onClick={startGame}
              className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-4 text-xl"
            >
              ИГРАТЬ
            </Button>

            <Card className="bg-black/50 border-red-800">
              <CardHeader>
                <CardTitle className="text-red-400 text-center">
                  РЕКОРДЫ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {highScores.map((score, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-white"
                    >
                      <span>#{index + 1}</span>
                      <span>{score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <div className="absolute top-4 left-4 text-2xl font-bold">
          ОЧКИ: {score}
        </div>

        <div className="absolute top-4 right-4 space-y-2">
          <Button
            onClick={blindSkebob}
            disabled={blindCooldown > 0}
            className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold"
          >
            {blindCooldown > 0
              ? `ПЕРЕЗАРЯДКА ${Math.ceil(blindCooldown / 10)}`
              : "ОСЛЕПИТЬ"}
          </Button>
        </div>

        <div
          ref={gameRef}
          className="absolute bottom-20 left-0 right-0 h-32 bg-gray-800 relative"
        >
          {/* Игрок */}
          <div
            className="absolute bottom-0 w-8 h-16 bg-blue-500 transition-all duration-100"
            style={{ left: `${playerPos}%` }}
          >
            <Icon name="User" size={32} className="text-white" />
          </div>

          {/* СКЕБОБ */}
          <div
            className={`absolute bottom-0 w-12 h-20 transition-all duration-100 ${isBlinded ? "opacity-30" : "opacity-100"}`}
            style={{ left: `${skebobPos}%` }}
          >
            <img
              src="https://cdn.poehali.dev/files/676c723d-f40b-4025-a779-4086080246ef.png"
              alt="СКЕБОБ"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Выход */}
          <div className="absolute bottom-0 right-0 w-12 h-16 bg-green-600 flex items-center justify-center">
            <Icon name="DoorOpen" size={24} className="text-white" />
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-sm opacity-70">
            ← → для движения | ПРОБЕЛ для ослепления
          </p>
        </div>
      </div>
    );
  }

  if (gameState === "gameOver") {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center text-white">
        <div className="text-center space-y-6">
          <h1
            className="text-6xl font-black text-red-400"
            style={{ fontFamily: "Impact, sans-serif" }}
          >
            ПОРАЖЕНИЕ!
          </h1>
          <p className="text-2xl">СКЕБОБ ПОЙМАЛ ТЕБЯ!</p>
          <p className="text-xl">Твой счет: {score}</p>

          <div className="space-y-4">
            <Button
              onClick={startGame}
              className="bg-red-800 hover:bg-red-700 text-white font-bold py-4 px-8 text-xl"
            >
              ИГРАТЬ СНОВА
            </Button>
            <Button
              onClick={backToMenu}
              variant="outline"
              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
            >
              В МЕНЮ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
