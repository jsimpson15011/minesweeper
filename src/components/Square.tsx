import React from "react";
import './Square.css'

type Props = {
    isFlag: boolean,
    isChecked: boolean,
    isBomb: boolean,
    bombCount: number,
    x:number,
    y:number
    handleClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, isBomb: boolean, y:number, x:number) => void;
    handleRightClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, y:number, x:number) => void;
    handleAuxClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, y:number, x:number) => void;
}
const Square = ({isFlag, isChecked, isBomb, bombCount,x, y, handleClick, handleRightClick, handleAuxClick}: Props) => {

    let buttonClass =  "";

    if (isChecked) buttonClass += "square_checked ";

    return (
        <button
            onContextMenu={(e) => handleRightClick(e,x,y)}
            onAuxClick={(e) => handleAuxClick(e,x,y)}
            onClick={(e) => handleClick(e,isBomb,x,y)}
            className={`square ${buttonClass}`} >
            {isFlag ? "🚩" : ""}
            {bombCount > 0 && isChecked ? bombCount : ""}
        </button>
    )
}

export default Square;