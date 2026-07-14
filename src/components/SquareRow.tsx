import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

function SquareRow({ children }: Props) {
  return (
    <div className="square-row" role="row">
      {children}
    </div>
  );
}

export default SquareRow;
