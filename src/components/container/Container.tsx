import React from 'react';
import Board from '../board/Board';
import './style.css';

interface ContainerProps {}

interface ContainerState {
    color: string;
    shape: 'line' | 'rectangle' | 'circle' | 'freeform';
    penSize: number;
    isShapeFilled: boolean;
}

class Container extends React.Component<ContainerProps, ContainerState> {
    private boardRef = React.createRef<Board>();

    constructor(props: ContainerProps) {
        super(props);
        this.state = {
            color: '#000000',
            shape: 'freeform',
            penSize: 3,
            isShapeFilled: false
        };
    }

    handleColorChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newColor = e.target.value;
        this.setState({ color: newColor });
        document.querySelectorAll("p").forEach((p) => {
            p.style.color = newColor;
        });
    };

    handleShapeChange = (shape: 'line' | 'rectangle' | 'circle' | 'freeform'): void => {
        if (shape === this.state.shape && (shape === 'rectangle' || shape === 'circle')) {
            this.setState(prevState => ({ isShapeFilled: !prevState.isShapeFilled }));
        } else {
            this.setState({ shape });
        }
    };

    handlePenSizeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const size = parseInt(e.target.value);
        this.setState({ penSize: size });
    };

    handleClearBoard = (): void => {
        this.boardRef.current?.clearBoard();
    };

    render(): React.ReactNode {
        return (
            <div className="container">
                <div className="toolbar">
                    <div className="tool-group">
                        <label>Color:</label>
                        <input
                            type="color"
                            value={this.state.color}
                            onChange={this.handleColorChange}
                            className="color-picker"
                        />
                    </div>

                    <div className="tool-group">
                        <div className="shape-buttons">
                            <button 
                                className={`shape-button ${this.state.shape === 'freeform' ? 'active' : ''}`}
                                onClick={() => this.handleShapeChange('freeform')}
                                title="Freeform"
                            >
                                <i className="fas fa-pencil-alt"></i>
                            </button>
                            <button 
                                className={`shape-button ${this.state.shape === 'line' ? 'active' : ''}`}
                                onClick={() => this.handleShapeChange('line')}
                                title="Line"
                            >
                                <i className="fas fa-ruler"></i>
                            </button>
                            <button 
                                className={`shape-button ${this.state.shape === 'rectangle' ? 'active' : ''}`}
                                onClick={() => this.handleShapeChange('rectangle')}
                                title={`Rectangle (${this.state.isShapeFilled ? 'Filled' : 'Hollow'})`}
                            >
                                <i className={`fa${this.state.isShapeFilled ? 's' : 'r'} fa-square`}></i>
                            </button>
                            <button 
                                className={`shape-button ${this.state.shape === 'circle' ? 'active' : ''}`}
                                onClick={() => this.handleShapeChange('circle')}
                                title={`Circle (${this.state.isShapeFilled ? 'Filled' : 'Hollow'})`}
                            >
                                <i className={`fa${this.state.isShapeFilled ? 's' : 'r'} fa-circle`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="tool-group">
                        <label>Pen Size:</label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={this.state.penSize}
                            onChange={this.handlePenSizeChange}
                            className="pen-size-slider"
                        />
                        <span className="pen-size-value">{this.state.penSize}px</span>
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
                        penSize={this.state.penSize}
                        isShapeFilled={this.state.isShapeFilled}
                    />
                </div>
            </div>
        );
    }
}

export default Container;
