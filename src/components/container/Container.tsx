import React from 'react';
import Board, { ShapeProps } from '../board/Board';
import Navbar from '../navbar/Navbar';
import './style.css';

interface ContainerProps {}

interface ContainerState {
    color: string;
    shape: 'line' | 'rectangle' | 'circle' | 'freeform' | 'eraser' | 'hand';
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
    };

    handleShapeChange = (shape: 'line' | 'rectangle' | 'circle' | 'freeform' | 'eraser' | 'hand'): void => {
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
            <div className="flex flex-col bg-white relative w-full h-screen max-w-full max-h-screen p-4 mt-20">
                <Navbar 
                    user={{ name: 'Guest', isLoggedIn: false }}
                    logoSrc="/vite.svg"
                    logoAlt="Whiteboard Logo"
                />
                <div className="flex gap-5 p-2.5 px-5 bg-gray-100 rounded-lg shadow-md absolute top-5 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-800">Color:</label>
                        <input
                            type="color"
                            value={this.state.color}
                            onChange={this.handleColorChange}
                            className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <button
                                className={`w-9 h-9 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'hand' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                onClick={() => this.handleShapeChange('hand')}
                                title="Hand Tool"
                            >
                                <i className="fa-regular fa-hand text-base"></i>
                            </button>
                            <button
                                className={`w-9 h-9 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'freeform' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                onClick={() => this.handleShapeChange('freeform')}
                                title="Freeform"
                            >
                                <i className="fas fa-pencil-alt text-base"></i>
                            </button>
                            <button
                                className={`w-9 h-9 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'eraser' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                onClick={() => this.handleShapeChange('eraser')}
                                title="Eraser"
                            >
                                <i className="fas fa-eraser text-base"></i>
                            </button>
                            <button
                                className={`w-9 h-9 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'line' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                onClick={() => this.handleShapeChange('line')}
                                title="Line"
                            >
                                <i className="fas fa-ruler text-base"></i>
                            </button>
                            <button
                                className={`w-9 h-9 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'rectangle' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                onClick={() => this.handleShapeChange('rectangle')}
                                title={`Rectangle (${this.state.isShapeFilled ? 'Filled' : 'Hollow'})`}
                            >
                                <i className={`fa${this.state.isShapeFilled ? 's' : 'r'} fa-square text-base`}></i>
                            </button>
                            <button
                                className={`w-9 h-9 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'circle' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                onClick={() => this.handleShapeChange('circle')}
                                title={`Circle (${this.state.isShapeFilled ? 'Filled' : 'Hollow'})`}
                            >
                                <i className={`fa${this.state.isShapeFilled ? 's' : 'r'} fa-circle text-base`}></i>
                            </button>
                            <button
                                onClick={() => {
                                    const stage = this.boardRef.current?.stageRef.current;
                                    if (stage) {
                                        const dataURL = stage.toDataURL();
                                        const link = document.createElement('a');
                                        link.href = dataURL;
                                        link.download = 'whiteboard.png';
                                        link.click();
                                    }
                                }}
                                className="px-3 py-1.5 bg-blue-500 text-white border-none rounded text-sm cursor-pointer transition-colors hover:bg-blue-400 active:bg-blue-700"
                            >
                                Export to Image
                            </button>
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e: Event) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (!file) return;

                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            if (!e.target?.result) return;
                                            
                                            const stage = this.boardRef.current?.stageRef.current;
                                            if (!stage) return;

                                            const imageObj = new Image();
                                            imageObj.onload = () => {
                                                // Add image as a shape to the board's state
                                                const imageShape: ShapeProps = {
                                                    id: Math.random().toString(),
                                                    type: 'image' as const,
                                                    x: 0,
                                                    y: 0,
                                                    width: stage.width(),
                                                    height: stage.height(),
                                                    stroke: '',
                                                    strokeWidth: 0,
                                                    image: imageObj
                                                };
                                                this.boardRef.current?.addShape(imageShape);
                                            };
                                            imageObj.src = e.target.result as string;
                                        };
                                        reader.readAsDataURL(file);
                                    };
                                    input.click();
                                }}
                                className="px-3 py-1.5 bg-green-500 text-white border-none rounded text-sm cursor-pointer transition-colors hover:bg-green-400 active:bg-green-700"
                            >
                                Load Image
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-800">Pen Size:</label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={this.state.penSize}
                            onChange={this.handlePenSizeChange}
                            className="w-24 cursor-pointer"
                        />
                        <span className="min-w-[40px] text-sm text-gray-800">{this.state.penSize}px</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={this.handleClearBoard}
                            className="px-3 py-1.5 bg-red-500 text-white border-none rounded text-sm cursor-pointer transition-colors hover:bg-red-400 active:bg-red-700"
                        >
                            Clear Board
                        </button>
                    </div>
                </div>
                <div className="flex-1 w-full h-screen">
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