import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

const CELL_SIZE = 40;
const MAZE_WIDTH = 25;
const MAZE_HEIGHT = 15;

// Лабиринт: 1 = стена, 0 = проход
const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const Index = () => {
  const [gameState, setGameState] = useState("menu"); // menu, playing, gameOver, victory
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [skebobPos, setSkebobPos] = useState({ x: 1, y: 13 });
  const [isBlinded, setIsBlinded] = useState(false);
  const [blindCooldown, setBlindCooldown] = useState(0);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([1250, 980, 765, 432, 201]);
  const gameRef = useRef<HTMLDivElement>(null);
  const [keys, setKeys] = useState({
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const isWall = (x: number, y: number) => {
    if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT) return true;
    return MAZE[y][x] === 1;
  };

  const isExit = (x: number, y: number) => {
    return MAZE[y][x] === 2;
  };

  const canMove = (x: number, y: number) => {
    return !isWall(x, y);
  };

  const getDistance = (
    pos1: { x: number; y: number },
    pos2: { x: number; y: number },
  ) => {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  };

  const findPath = (
    start: { x: number; y: number },
    target: { x: number; y: number },
  ) => {
    const directions = [
      { x: 0, y: -1 }, // вверх
      { x: 0, y: 1 }, // вниз
      { x: -1, y: 0 }, // влево
      { x: 1, y: 0 }, // вправо
    ];

    let bestMove = start;
    let bestDistance = getDistance(start, target);

    for (const dir of directions) {
      const newPos = { x: start.x + dir.x, y: start.y + dir.y };
      if (canMove(newPos.x, newPos.y)) {
        const distance = getDistance(newPos, target);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMove = newPos;
        }
      }
    }

    return bestMove;
  };

  useEffect(() => {
    if (gameState === "playing") {
      const gameLoop = setInterval(() => {
        setScore((prev) => prev + 1);

        // Проверка на победу
        if (isExit(playerPos.x, playerPos.y)) {
          setGameState("victory");
          return;
        }

        // Движение СКЕБОБА
        if (!isBlinded) {
          setSkebobPos((prev) => {
            const newPos = findPath(prev, playerPos);
            if (getDistance(newPos, playerPos) <= 1) {
              setGameState("gameOver");
            }
            return newPos;
          });
        }

        if (blindCooldown > 0) {
          setBlindCooldown((prev) => prev - 1);
        }
      }, 200);

      return () => clearInterval(gameLoop);
    }
  }, [gameState, playerPos, isBlinded, blindCooldown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      e.preventDefault();
      if (e.key === "ArrowLeft" || e.key === "a")
        setKeys((prev) => ({ ...prev, left: true }));
      if (e.key === "ArrowRight" || e.key === "d")
        setKeys((prev) => ({ ...prev, right: true }));
      if (e.key === "ArrowUp" || e.key === "w")
        setKeys((prev) => ({ ...prev, up: true }));
      if (e.key === "ArrowDown" || e.key === "s")
        setKeys((prev) => ({ ...prev, down: true }));
      if (e.key === " ") {
        blindSkebob();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a")
        setKeys((prev) => ({ ...prev, left: false }));
      if (e.key === "ArrowRight" || e.key === "d")
        setKeys((prev) => ({ ...prev, right: false }));
      if (e.key === "ArrowUp" || e.key === "w")
        setKeys((prev) => ({ ...prev, up: false }));
      if (e.key === "ArrowDown" || e.key === "s")
        setKeys((prev) => ({ ...prev, down: false }));
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
          let newPos = { ...prev };

          if (keys.left && canMove(prev.x - 1, prev.y)) newPos.x = prev.x - 1;
          if (keys.right && canMove(prev.x + 1, prev.y)) newPos.x = prev.x + 1;
          if (keys.up && canMove(prev.x, prev.y - 1)) newPos.y = prev.y - 1;
          if (keys.down && canMove(prev.x, prev.y + 1)) newPos.y = prev.y + 1;

          return newPos;
        });
      }, 150);

      return () => clearInterval(moveLoop);
    }
  }, [keys, gameState]);

  const startGame = () => {
    setGameState("playing");
    setPlayerPos({ x: 1, y: 1 });
    setSkebobPos({ x: 1, y: 13 });
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
      <div className="h-screen w-screen bg-gradient-to-b from-red-900 via-black to-red-900 flex items-center justify-center text-white overflow-hidden">
        <div className="text-center space-y-8 max-w-md">
          <h1
            className="text-6xl font-black tracking-wider mb-4"
            style={{ fontFamily: "Impact, sans-serif" }}
          >
            СКЕБОБ
          </h1>
          <p className="text-xl opacity-80 mb-8">ХОРРОР ЛАБИРИНТ</p>

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
      <div className="h-screen w-screen bg-black text-white relative overflow-hidden">
        <div className="absolute top-4 left-4 text-2xl font-bold z-10">
          ОЧКИ: {score}
        </div>

        <div className="absolute top-4 right-4 space-y-2 z-10">
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
          className="absolute inset-0 flex items-center justify-center"
          style={{
            width: MAZE_WIDTH * CELL_SIZE,
            height: MAZE_HEIGHT * CELL_SIZE,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Лабиринт */}
          {MAZE.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`absolute ${
                  cell === 1
                    ? "bg-red-900"
                    : cell === 2
                      ? "bg-green-600"
                      : "bg-gray-900"
                } border border-gray-700`}
                style={{
                  left: x * CELL_SIZE,
                  top: y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              >
                {cell === 2 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="DoorOpen" size={24} className="text-white" />
                  </div>
                )}
              </div>
            )),
          )}

          {/* Игрок */}
          <div
            className="absolute bg-blue-500 rounded-full flex items-center justify-center transition-all duration-150 z-20"
            style={{
              left: playerPos.x * CELL_SIZE + 4,
              top: playerPos.y * CELL_SIZE + 4,
              width: CELL_SIZE - 8,
              height: CELL_SIZE - 8,
            }}
          >
            <Icon name="User" size={24} className="text-white" />
          </div>

          {/* СКЕБОБ */}
          <div
            className={`absolute rounded-full flex items-center justify-center transition-all duration-200 z-20 ${
              isBlinded ? "opacity-30" : "opacity-100"
            }`}
            style={{
              left: skebobPos.x * CELL_SIZE + 2,
              top: skebobPos.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
            }}
          >
            <img
              src="https://cdn.poehali.dev/files/676c723d-f40b-4025-a779-4086080246ef.png"
              alt="СКЕБОБ"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-10">
          <p className="text-sm opacity-70">
            WASD или стрелки для движения | ПРОБЕЛ для ослепления
          </p>
        </div>
      </div>
    );
  }

  if (gameState === "victory") {
    return (
      <div className="h-screen w-screen bg-green-900 flex items-center justify-center text-white overflow-hidden">
        <div className="text-center space-y-6">
          <h1
            className="text-6xl font-black text-green-400"
            style={{ fontFamily: "Impact, sans-serif" }}
          >
            ПОБЕДА!
          </h1>
          <p className="text-2xl">ТЫ СБЕЖАЛ ОТ СКЕБОБА!</p>
          <p className="text-xl">Твой счет: {score}</p>

          <div className="space-y-4">
            <Button
              onClick={startGame}
              className="bg-green-800 hover:bg-green-700 text-white font-bold py-4 px-8 text-xl"
            >
              ИГРАТЬ СНОВА
            </Button>
            <Button
              onClick={backToMenu}
              variant="outline"
              className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
            >
              В МЕНЮ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "gameOver") {
    return (
      <div className="h-screen w-screen bg-red-900 flex items-center justify-center text-white overflow-hidden">
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
