import React from 'react';
import { Stage, Layer, Line, Circle, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { io, Socket } from 'socket.io-client';

interface Point {
    x: number;
    y: number;
}

interface ShapeProps {
    id: string;
    points?: number[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    stroke: string;
    strokeWidth: number;
    fill?: string;
    isDragging?: boolean;
    type: 'line' | 'rectangle' | 'circle' | 'freeform';
}

interface BoardProps {
    color: string;
    shape: 'line' | 'rectangle' | 'circle' | 'freeform' | 'eraser' | 'hand';
    penSize: number;
    isShapeFilled: boolean;
}

interface BoardState {
    shapes: ShapeProps[];
    isDrawing: boolean;
    currentPoints: number[];
    mousePos: Point | null;
    isDragging: boolean;
}

class Board extends React.Component<BoardProps, BoardState> {
    private stageRef = React.createRef<any>();
    private socket: Socket;

    constructor(props: BoardProps) {
        super(props);
        this.state = {
            shapes: [],
            isDrawing: false,
            currentPoints: [],
            mousePos: null,
            isDragging: false
        };

        this.socket = io(`${import.meta.env.VITE_SERVER_URL}:${import.meta.env.VITE_SERVER_PORT}`);

        this.socket.on("draw", (shape: ShapeProps) => {
            this.setState(prevState => ({
                shapes: [...prevState.shapes, shape]
            }));
        });

        this.socket.on("shape-moved", (data: { id: string; x: number; y: number }) => {
            this.setState(prevState => ({
                shapes: prevState.shapes.map(shape => 
                    shape.id === data.id && !shape.isDragging
                        ? { ...shape, x: data.x, y: data.y }
                        : shape
                )
            }));
        });

        this.socket.on("clear", () => {
            this.setState({ shapes: [] });
        });
    }

    componentDidUpdate(prevProps: BoardProps) {
        if (this.props.shape !== prevProps.shape) {
            const stage = this.stageRef.current;
            if (stage) {
                if (this.props.shape === 'hand') {
                    stage.container().style.cursor = 'grab';
                } else if (this.props.shape === 'eraser') {
                    stage.container().style.cursor = 'crosshair';
                } else {
                    stage.container().style.cursor = 'default';
                }
            }
        }
    }

    handleMouseDown = (e: KonvaEventObject<MouseEvent>): void => {
        if (this.props.shape === 'hand') {
            const stage = this.stageRef.current;
            if (stage) {
                stage.container().style.cursor = 'grabbing';
            }
            return;
        }

        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        this.setState({
            isDrawing: true,
            currentPoints: [pos.x, pos.y]
        });
    };

    handleMouseMove = (e: KonvaEventObject<MouseEvent>): void => {
        if (this.props.shape === 'hand') {
            return;
        }

        if (!this.state.isDrawing) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        // For shapes, we only need start point and current point
        if (this.props.shape === 'rectangle' || this.props.shape === 'circle') {
            this.setState({
                currentPoints: [
                    this.state.currentPoints[0],
                    this.state.currentPoints[1],
                    point.x,
                    point.y
                ]
            });
        } 
        // For freeform and eraser, we append points
        else if (this.props.shape === 'freeform' || this.props.shape === 'eraser') {
            this.setState(prevState => ({
                currentPoints: [...prevState.currentPoints, point.x, point.y]
            }));
        }
        // For line, we update end point
        else if (this.props.shape === 'line') {
            this.setState({
                currentPoints: [
                    this.state.currentPoints[0],
                    this.state.currentPoints[1],
                    point.x,
                    point.y
                ]
            });
        }
    };

    handleMouseUp = (e: KonvaEventObject<MouseEvent>): void => {
        if (this.props.shape === 'hand') {
            const stage = this.stageRef.current;
            if (stage) {
                stage.container().style.cursor = 'grab';
            }
            return;
        }

        if (!this.state.isDrawing) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        this.setState({ isDrawing: false });

        const id = Math.random().toString();
        const newShape: ShapeProps = {
            id,
            points: this.state.currentPoints,
            stroke: this.props.shape === 'eraser' ? '#ffffff' : this.props.color,
            strokeWidth: this.props.penSize,
            type: this.props.shape === 'eraser' ? 'freeform' : this.props.shape as ShapeProps['type'],
            fill: this.props.isShapeFilled ? this.props.color : 'transparent'
        };

        if (this.props.shape === 'rectangle' || this.props.shape === 'circle') {
            const startPoint = {
                x: this.state.currentPoints[0],
                y: this.state.currentPoints[1]
            };
            newShape.x = Math.min(startPoint.x, point.x);
            newShape.y = Math.min(startPoint.y, point.y);
            newShape.width = Math.abs(point.x - startPoint.x);
            newShape.height = Math.abs(point.y - startPoint.y);
            delete newShape.points;
        }

        this.setState(prevState => ({
            shapes: [...prevState.shapes, newShape]
        }));

        this.socket.emit("draw", newShape);
    };

    handleDragStart = (_e: KonvaEventObject<DragEvent>, id: string): void => {
        if (this.props.shape !== 'hand') return;
        
        this.setState(prevState => ({
            shapes: prevState.shapes.map(shape => 
                shape.id === id ? { ...shape, isDragging: true } : shape
            )
        }));
    };

    handleDragEnd = (e: KonvaEventObject<DragEvent>, id: string) => {
        if (this.props.shape !== 'hand') return;

        const shape = e.target;
        this.setState(prevState => ({
            shapes: prevState.shapes.map(s => 
                s.id === id ? { ...s, isDragging: false, x: shape.x(), y: shape.y() } : s
            )
        }));

        this.socket.emit("shape-moved", { id, x: shape.x(), y: shape.y() });
    };

    clearBoard = (): void => {
        this.setState({ shapes: [] });
        this.socket.emit("clear");
    };

    render(): React.ReactNode {
        return (
            <Stage
                ref={this.stageRef}
                width={window.innerWidth}
                height={window.innerHeight - 100}
                onMouseDown={this.handleMouseDown}
                onMouseMove={this.handleMouseMove}
                onMouseUp={this.handleMouseUp}
                style={{ backgroundColor: 'white' }}
            >
                <Layer>
                    {this.state.shapes.map((shape, i) => {
                        if (shape.type === 'freeform' || shape.type === 'line') {
                            return (
                                <Line
                                    key={i}
                                    points={shape.points}
                                    stroke={shape.stroke}
                                    strokeWidth={shape.strokeWidth}
                                    tension={0.5}
                                    lineCap="round"
                                    globalCompositeOperation={
                                        shape.stroke === '#ffffff' ? 'destination-out' : 'source-over'
                                    }
                                    draggable={this.props.shape === 'hand'}
                                    onDragStart={(e) => this.handleDragStart(e, shape.id)}
                                    onDragEnd={(e) => this.handleDragEnd(e, shape.id)}
                                />
                            );
                        } else if (shape.type === 'rectangle') {
                            return (
                                <Rect
                                    key={i}
                                    x={shape.x}
                                    y={shape.y}
                                    width={shape.width}
                                    height={shape.height}
                                    stroke={shape.stroke}
                                    strokeWidth={shape.strokeWidth}
                                    fill={shape.fill}
                                    draggable={this.props.shape === 'hand'}
                                    onDragStart={(e) => this.handleDragStart(e, shape.id)}
                                    onDragEnd={(e) => this.handleDragEnd(e, shape.id)}
                                />
                            );
                        } else if (shape.type === 'circle') {
                            return (
                                <Circle
                                    key={i}
                                    x={shape.x! + shape.width! / 2}
                                    y={shape.y! + shape.height! / 2}
                                    radius={Math.max(shape.width!, shape.height!) / 2}
                                    stroke={shape.stroke}
                                    strokeWidth={shape.strokeWidth}
                                    fill={shape.fill}
                                    draggable={this.props.shape === 'hand'}
                                    onDragStart={(e) => this.handleDragStart(e, shape.id)}
                                    onDragEnd={(e) => this.handleDragEnd(e, shape.id)}
                                />
                            );
                        }
                        return null;
                    })}
                    {this.state.isDrawing && (
                        <>
                            {(this.props.shape === 'freeform' || this.props.shape === 'line' || this.props.shape === 'eraser') && (
                                <Line
                                    points={this.state.currentPoints}
                                    stroke={this.props.shape === 'eraser' ? '#ffffff' : this.props.color}
                                    strokeWidth={this.props.penSize}
                                    tension={0.5}
                                    lineCap="round"
                                    globalCompositeOperation={
                                        this.props.shape === 'eraser' ? 'destination-out' : 'source-over'
                                    }
                                />
                            )}
                            {this.props.shape === 'rectangle' && this.state.currentPoints.length >= 2 && (
                                <Rect
                                    x={Math.min(this.state.currentPoints[0], this.state.currentPoints[2] || this.state.currentPoints[0])}
                                    y={Math.min(this.state.currentPoints[1], this.state.currentPoints[3] || this.state.currentPoints[1])}
                                    width={Math.abs((this.state.currentPoints[2] || this.state.currentPoints[0]) - this.state.currentPoints[0])}
                                    height={Math.abs((this.state.currentPoints[3] || this.state.currentPoints[1]) - this.state.currentPoints[1])}
                                    stroke={this.props.color}
                                    strokeWidth={this.props.penSize}
                                    fill={this.props.isShapeFilled ? this.props.color : 'transparent'}
                                />
                            )}
                            {this.props.shape === 'circle' && this.state.currentPoints.length >= 2 && (
                                <Circle
                                    x={this.state.currentPoints[0]}
                                    y={this.state.currentPoints[1]}
                                    radius={Math.sqrt(
                                        Math.pow((this.state.currentPoints[2] || this.state.currentPoints[0]) - this.state.currentPoints[0], 2) +
                                        Math.pow((this.state.currentPoints[3] || this.state.currentPoints[1]) - this.state.currentPoints[1], 2)
                                    )}
                                    stroke={this.props.color}
                                    strokeWidth={this.props.penSize}
                                    fill={this.props.isShapeFilled ? this.props.color : 'transparent'}
                                />
                            )}
                        </>
                    )}
                </Layer>
            </Stage>
        );
    }
}

export default Board;
