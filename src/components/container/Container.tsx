import React from 'react';
import Board from '../board/Board';
import { exportToImage, loadImage } from '@/utils/image';
import './style.css';

type ContainerProps = object

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
            <div>
                <div className="flex flex-col bg-white relative w-full h-screen max-w-full max-h-screen p-4 mt-20">
                    <div
                        className="flex gap-5 p-2.5 px-5 bg-gray-100 rounded-lg shadow-md absolute top-5 left-1/2 transform -translate-x-1/2 z-10">
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
                                    className={`w-9 h-9 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:border-gray-500 hover:text-gray-800 ${this.state.shape === 'freeform' ? 'bg-blue-50 border-blue-500 text-blue-500' : ''}`}
                                    onClick={() => this.handleShapeChange('freeform')}
                                    title="Freeform"
                                >
                                    <i className="fas fa-pencil-alt text-base"></i>
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
                            <button
                                onClick={() => {
                                    const canvas = this.boardRef.current?.canvasRef.current;
                                    if (canvas) exportToImage(canvas);
                                }}
                                className="px-3 py-1.5 bg-blue-500 text-white border-none rounded text-sm cursor-pointer transition-colors hover:bg-blue-400 active:bg-blue-700"
                            >
                                Export to Image
                            </button>
                            <button
                                onClick={() => {
                                    const canvas = this.boardRef.current?.canvasRef.current;
                                    if (canvas) loadImage(canvas);
                                }}
                                className="px-3 py-1.5 bg-green-500 text-white border-none rounded text-sm cursor-pointer transition-colors hover:bg-green-400 active:bg-green-700"
                            >
                                Load Image
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
            </div>
        );
    }
}

export default Container;