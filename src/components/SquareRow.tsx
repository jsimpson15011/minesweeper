import {ReactNode} from "react";

const SquareRow = ({children}:{children: ReactNode}) => {
    return(<div style={{display:"flex"}}>
        {children}
    </div>)
}

export default SquareRow;