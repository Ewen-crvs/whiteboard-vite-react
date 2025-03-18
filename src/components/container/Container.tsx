import React, { ReactElement } from 'react';
import Board from '../board/Board';

import './style.css';

interface ContainerProps {}

interface ContainerState {
    color: string;
    shape: 'line' | 'rectangle' | 'circle' | 'freeform';
}

class Container extends React.Component<ContainerProps, ContainerState> 
{
    private boardRef = React.createRef<Board>();

    constructor(props: ContainerProps) {
        super(props);
        this.state = {
            color: '#000000',
            shape: 'freeform'
        };
    }

    handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = event.target.value;
        this.setState({ color: newColor });
        document.querySelectorAll("p").forEach((p) => {
            p.style.color = newColor;
        });
    }

    handleShapeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({ 
            shape: event.target.value as ContainerState['shape']
        });
    }

    handleClearBoard = () => {
        this.boardRef.current?.clearBoard();
    }

    render(): ReactElement {
        return (
            <div className="container">
                <div className="toolbar">
                    <div className="tool-group">
                        <label>Color:</label>
                        <input 
                            type="color" 
                            value={this.state.color}
                            onChange={this.handleColorChange}
                        />
                    </div>
                    <div className="tool-group">
                        <label>Shape:</label>
                        <select 
                            value={this.state.shape} 
                            onChange={this.handleShapeChange}
                            className="shape-selector"
                        >
                            <option value="freeform">Freeform</option>
                            <option value="line">Line</option>
                            <option value="rectangle">Rectangle</option>
                            <option value="circle">Circle</option>
                        </select>
                    </div>
                    <div className="tool-group">
                        <button 
                            onClick={this.handleClearBoard}
                            className="clear-button"
                        >
                            Clear Board
                        </button>
                    </div>
                </div>

                <div className="board-container">
                    <Board 
                        ref={this.boardRef}
                        color={this.state.color}
                        shape={this.state.shape}
                    />
                </div>
            </div>
        );
    }
}

export default Container;
