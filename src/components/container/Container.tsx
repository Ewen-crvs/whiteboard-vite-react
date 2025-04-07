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

    handleUndo = (): void => {
        this.boardRef.current?.undo();
    };

    handleRedo = (): void => {
        this.boardRef.current?.redo();
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
            <div className="flex flex-col bg-white relative w-full h-screen max-w-full max-h-screen">
                <div className="fixed top-0 left-0 right-0 z-20">
                    <Navbar
                        user={{ name: 'Guest', isLoggedIn: false }}
                        logoSrc="/vite.svg"
                        logoAlt="Whiteboard Logo"
                    />
                </div>

                {/* Main container with sidebar and canvas */}
                <div className="flex flex-1 overflow-hidden pt-[60px]">
                    {/* Sidebar with tools - vertical layout */}
                    <div className="bg-gray-100 shadow-md flex flex-col p-3 space-y-4 z-10 border-r border-gray-200 overflow-y-auto max-h-full">
                        <div className="flex flex-col flex-1 overflow-auto gap-4 pb-4">
                            {/* Color Picker */}
                            <div className="flex flex-col items-center gap-2">
                                <input
                                    type="color"
                                    value={this.state.color}
                                    onChange={this.handleColorChange}
                                    className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                                />
                            </div>

                            <div className="w-full h-px bg-gray-300"></div>

                            {/* Shape Tools */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex flex-col gap-2">
                                    <button
                                        className={`w-10 h-10 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'hand' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                        onClick={() => this.handleShapeChange('hand')}
                                        title="Hand Tool"
                                    >
                                        <i className="fa-regular fa-hand text-base"></i>
                                    </button>
                                    <button
                                        className={`w-10 h-10 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'freeform' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                        onClick={() => this.handleShapeChange('freeform')}
                                        title="Freeform"
                                    >
                                        <i className="fas fa-pencil-alt text-base"></i>
                                    </button>
                                    <button
                                        className={`w-10 h-10 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'eraser' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                        onClick={() => this.handleShapeChange('eraser')}
                                        title="Eraser"
                                    >
                                        <i className="fas fa-eraser text-base"></i>
                                    </button>
                                    <button
                                        className={`w-10 h-10 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'line' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                        onClick={() => this.handleShapeChange('line')}
                                        title="Line"
                                    >
                                        <i className="fas fa-ruler text-base"></i>
                                    </button>
                                    <button
                                        className={`w-10 h-10 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'rectangle' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                        onClick={() => this.handleShapeChange('rectangle')}
                                        title={`Rectangle (${this.state.isShapeFilled ? 'Filled' : 'Hollow'})`}
                                    >
                                        <i className={`fa${this.state.isShapeFilled ? 's' : 'r'} fa-square text-base`}></i>
                                    </button>
                                    <button
                                        className={`w-10 h-10 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'circle' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                        onClick={() => this.handleShapeChange('circle')}
                                        title={`Circle (${this.state.isShapeFilled ? 'Filled' : 'Hollow'})`}
                                    >
                                        <i className={`fa${this.state.isShapeFilled ? 's' : 'r'} fa-circle text-base`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-300"></div>

                            {/* Pen Size Slider */}
                            <div className="flex flex-col items-center gap-2">
                                <label className="text-sm text-gray-800 font-medium">Pen Size</label>
                                <div className="flex flex-col items-center w-full">
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={this.state.penSize}
                                        onChange={this.handlePenSizeChange}
                                        className="w-full cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-800 mt-1">{this.state.penSize}px</span>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-300"></div>

                            {/* History Controls */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex flex-col gap-2 w-full">
                                    <button
                                        onClick={this.handleUndo}
                                        className="px-2 py-2 bg-gray-500 text-white border-none rounded text-sm cursor-pointer transition-colors hover:bg-gray-400 active:bg-gray-700 w-full flex items-center justify-center"
                                        title="Undo (Ctrl+Z)"
                                    >
                                        <i className="fas fa-undo mr-1"></i> Undo
                                    </button>
                                    <button
                                        onClick={this.handleRedo}
                                        className="px-2 py-2 bg-gray-500 text-white border-none rounded text-sm cursor-pointer transition-colors hover:bg-gray-400 active:bg-gray-700 w-full flex items-center justify-center"
                                        title="Redo (Ctrl+Y)"
                                    >
                                        <i className="fas fa-redo mr-1"></i> Redo
                                    </button>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-300"></div>

                            {/* Clear Board Button */}
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={this.handleClearBoard}
                                    className="px-3 py-2 bg-red-500 text-white border-none rounded text-sm cursor-pointer transition-colors hover:bg-red-400 active:bg-red-700 w-full"
                                >
                                    Clear Board
                                </button>
                            </div>

                            <div className="w-full h-px bg-gray-300"></div>

                            {/* Export/Import Buttons - Stacked for small screens */}
                            <div className="flex flex-col items-center gap-2">
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
                                    className="px-2 py-2 bg-blue-500 text-white border-none rounded text-sm cursor-pointer transition-colors hover:bg-blue-400 active:bg-blue-700 w-full flex items-center justify-center"
                                >
                                    <i className="fas fa-download mr-1"></i> Export
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
                                    className="px-2 py-2 bg-green-500 text-white border-none rounded text-sm cursor-pointer transition-colors hover:bg-green-400 active:bg-green-700 w-full flex items-center justify-center"
                                >
                                    <i className="fas fa-upload mr-1"></i> Import
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Canvas container with padding and border */}
                    <div className="flex-1 p-4 overflow-hidden">
                        <div className="w-full h-full border-2 border-gray-300 rounded-lg overflow-hidden">
                            <Board
                                ref={this.boardRef}
                                color={this.state.color}
                                shape={this.state.shape}
                                penSize={this.state.penSize}
                                isShapeFilled={this.state.isShapeFilled}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Container;