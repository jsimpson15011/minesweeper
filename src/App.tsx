import './App.css'
import React, {useEffect, useState} from "react";
import SquareRow from "./components/SquareRow.tsx";
import Square from "./components/Square.tsx";

function App() {
    const [boardSize, setBoardSize] = useState(10);
    const [numberOfBombs, setNumberOfBombs] = useState(13);
    const [numberOfFlags, setNumberOfFlags] = useState(0);
    const [bombBoard, setBombBoard] = useState<boolean[][]>([]);
    const [flagBoard, setFlagBoard] = useState<boolean[][]>([]);
    const [checkedBoard, setCheckedBoard] = useState<boolean[][]>([]);
    const [bombCountBoard, setBombCountBoard] = useState<number[][]>([]);
    const [gameState, setGameState] = useState<"play" | "victory" | "defeat">("play");

    useEffect(() => {
        function createBombLocations() {
            const numberOfSquares = boardSize * boardSize;
            const bombSquares = new Set<number>();

            while (bombSquares.size < numberOfBombs) {
                bombSquares.add(Math.floor(Math.random() * numberOfSquares));
            }

            return bombSquares;
        }

        function createBombBoard() {
            const newBoard: boolean[][] = [];
            const bombLocations = createBombLocations();
            let squareIndex = 0;

            for (let i = 0; i < boardSize; i++) {
                newBoard[i] = [];
                for (let j = 0; j < boardSize; j++) {
                    newBoard[i][j] = bombLocations.has(squareIndex);
                    squareIndex++;
                }
            }
            return newBoard;
        }

        function createEmptyBoard<T>(defaultValue: T): T[][] {
            const newBoard: T[][] = [];

            for (let i = 0; i < boardSize; i++) {
                newBoard[i] = [];
                for (let j = 0; j < boardSize; j++) {
                    newBoard[i][j] = defaultValue;
                }
            }

            return newBoard;
        }

        setFlagBoard(createEmptyBoard<boolean>(false));
        setCheckedBoard(createEmptyBoard<boolean>(false));
        setBombBoard(createBombBoard());
        setBombCountBoard(createEmptyBoard<number>(0))

    }, [boardSize, numberOfBombs]);

    useEffect(() => {
        let count = 0;
        flagBoard.forEach(x => {
            x.forEach(y => {
                if (y) count++;
            })
        });
        setNumberOfFlags(count);
    }, [flagBoard]);

    useEffect(() => {
        let checkedCount = 0;
        checkedBoard.forEach(x => {
            x.forEach(y => {
                if (y) checkedCount++;
            })
        });

        if (checkedCount + numberOfBombs === boardSize * boardSize) {
            setGameState("victory");
        }

    }, [boardSize, checkedBoard, numberOfBombs]);

    function floodFill(x: number, y: number): void {
        if (x < 0
            || y < 0
            || x > bombBoard.length - 1
            || y > bombBoard[0].length - 1
            || bombBoard[x][y]
            || flagBoard[x][y]
            || checkedBoard[x][y]
        ) return;

        let bombCount = 0;
        if (bombBoard[x - 1]?.[y]) bombCount++;
        if (bombBoard[x - 1]?.[y - 1]) bombCount++;
        if (bombBoard[x - 1]?.[y + 1]) bombCount++;
        if (bombBoard[x]?.[y - 1]) bombCount++;
        if (bombBoard[x]?.[y + 1]) bombCount++;
        if (bombBoard[x + 1]?.[y]) bombCount++;
        if (bombBoard[x + 1]?.[y - 1]) bombCount++;
        if (bombBoard[x + 1]?.[y + 1]) bombCount++;

        const updatedCheckedBoard = [...checkedBoard];
        const updatedCountBoard = [...bombCountBoard];

        updatedCheckedBoard[x][y] = true;
        updatedCountBoard[x][y] = bombCount;


        setBombCountBoard(updatedCountBoard);
        setCheckedBoard(updatedCheckedBoard);

        if (bombCount > 0) return;

        floodFill(x - 1, y);
        floodFill(x - 1, y - 1);
        floodFill(x - 1, y + 1);
        floodFill(x + 1, y);
        floodFill(x + 1, y - 1);
        floodFill(x + 1, y + 1);
        floodFill(x, y - 1);
        floodFill(x, y + 1);
    }

    const handleLeftClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, x: number, y: number) => {
        e.preventDefault();

        if (bombBoard[x][y]) {
            setGameState("defeat");
        } else {
            const updatedFlagBoard = [...flagBoard];

            updatedFlagBoard[x][y] = false;

            floodFill(x, y);

            setFlagBoard(updatedFlagBoard);
        }
    }

    const handleRightClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
    }

    const handleAuxClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, x: number, y: number) => {
        e.preventDefault();

        switch (e.button) {
            case 1: {
                let adjacentFlagCount = 0;
                if (flagBoard?.[x + 1]?.[y]) adjacentFlagCount++;
                if (flagBoard?.[x + 1]?.[y + 1]) adjacentFlagCount++;
                if (flagBoard?.[x + 1]?.[y - 1]) adjacentFlagCount++;
                if (flagBoard?.[x - 1]?.[y]) adjacentFlagCount++;
                if (flagBoard?.[x - 1]?.[y + 1]) adjacentFlagCount++;
                if (flagBoard?.[x - 1]?.[y - 1]) adjacentFlagCount++;
                if (flagBoard?.[x]?.[y + 1]) adjacentFlagCount++;
                if (flagBoard?.[x]?.[y - 1]) adjacentFlagCount++;

                if (adjacentFlagCount === bombCountBoard[x][y]){
                    floodFill(x,y);
                    floodFill(x + 1, y);
                    floodFill(x + 1, y + 1);
                    floodFill(x + 1, y - 1);
                    floodFill(x - 1, y);
                    floodFill(x - 1, y + 1);
                    floodFill(x -1, y - 1);
                    floodFill(x, y + 1);
                    floodFill(x, y - 1);

                    if (bombBoard?.[x]?.[y] && !flagBoard?.[x]?.[y]) setGameState("defeat");
                    if (bombBoard?.[x]?.[y + 1] && !flagBoard?.[x]?.[y + 1]) setGameState("defeat");
                    if (bombBoard?.[x]?.[y - 1] && !flagBoard?.[x]?.[y - 1]) setGameState("defeat");
                    if (bombBoard?.[x + 1]?.[y] && !flagBoard?.[x + 1]?.[y]) setGameState("defeat");
                    if (bombBoard?.[x + 1]?.[y + 1] && !flagBoard?.[x + 1]?.[y + 1]) setGameState("defeat");
                    if (bombBoard?.[x + 1]?.[y - 1] && !flagBoard?.[x + 1]?.[y - 1]) setGameState("defeat");
                    if (bombBoard?.[x - 1]?.[y] && !flagBoard?.[x - 1]?.[y]) setGameState("defeat");
                    if (bombBoard?.[x - 1]?.[y + 1] && !flagBoard?.[x - 1]?.[y + 1]) setGameState("defeat");
                    if (bombBoard?.[x - 1]?.[y - 1] && !flagBoard?.[x - 1]?.[y - 1]) setGameState("defeat");

                }
                break;
            }
            case 2: {
                if (checkedBoard[x][y]) return;

                const updatedFlagBoard = [...flagBoard];

                updatedFlagBoard[x][y] = !updatedFlagBoard[x][y];

                setFlagBoard(updatedFlagBoard);

                break;
            }
            default:
                return;
        }

    }


    const boardElements = <div>
        <div>{numberOfBombs - numberOfFlags}</div>
        {
            bombBoard.map((isBombRow, y) => {
                return <SquareRow key={y}>
                    {
                        isBombRow.map((_, x) => {
                            return <Square
                                x={x}
                                y={y}
                                isBomb={bombBoard[x][y]}
                                bombCount={bombCountBoard[x][y]}
                                handleRightClick={handleRightClick}
                                handleAuxClick={(e) => handleAuxClick(e, x, y)}
                                isChecked={checkedBoard[x][y]}
                                isFlag={flagBoard[x][y]}
                                handleClick={(e) => handleLeftClick(e, x, y)}
                                key={x + "-" + y}
                            />
                        })
                    }
                </SquareRow>
            })
        }
    </div>

    switch (gameState) {
        case "defeat":
            return <div>
                LOSER
                {
                    boardElements
                }
            </div>;
        case "victory":
            return <div>
                WINNER
                {
                    boardElements
                }
            </div>;
        case "play":
            return <>
                {
                    boardElements
                }
                <label htmlFor={"boardSize"}>Board Size: </label>
                <input name={"boardSize"} type={"number"} value={boardSize}
                       onChange={event => setBoardSize(parseInt(event.target.value))}/>
                <label htmlFor={"bombCount"}>Number of Bombs</label>
                <input name={"bombCount"} type={"number"} value={numberOfBombs}
                       onChange={event => setNumberOfBombs(parseInt(event.target.value))}/>
            </>
    }
}

export default App
