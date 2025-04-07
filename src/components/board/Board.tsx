import React from "react";
import { Stage, Layer, Line, Circle, Rect, Image } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { io, Socket } from "socket.io-client";

interface Point {
    x: number;
    y: number;
}

export interface ShapeProps {
    id: string;
    points?: number[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    stroke: string;
    strokeWidth: number;
    fill?: string;
    type: "line" | "rectangle" | "circle" | "freeform" | "image";
    image?: HTMLImageElement;
}

interface BoardProps {
    shape: "line" | "rectangle" | "circle" | "freeform" | "eraser" | "hand";
    color: string;
    penSize: number;
    isShapeFilled: boolean;
}

interface BoardState {
    shapes: ShapeProps[];
    isDrawing: boolean;
    currentPoints: number[];
    mousePos: Point | null;
    currentDragId: string | null;
    history: ShapeProps[][]; // Pour stocker l'historique
    historyIndex: number; // Index actuel dans l'historique
}

class Board extends React.Component<BoardProps, BoardState> {
    // Helper method to calculate distance from a point to a line segment
    private distanceToSegment = (point: Point, v: Point, w: Point): number => {
        // Calculate squared length of segment
        const l2 = Math.pow(w.x - v.x, 2) + Math.pow(w.y - v.y, 2);
        if (l2 === 0) return Math.sqrt(Math.pow(point.x - v.x, 2) + Math.pow(point.y - v.y, 2)); // v == w case
        
        // Consider the line extending the segment, parameterized as v + t (w - v)
        // We find projection of point p onto the line. 
        // It falls where t = [(p-v) . (w-v)] / |w-v|^2
        // We clamp t from [0,1] to handle points outside the segment vw.
        const t = Math.max(0, Math.min(1, ((point.x - v.x) * (w.x - v.x) + (point.y - v.y) * (w.y - v.y)) / l2));
        
        // Projection falls on the segment
        const projection = { 
            x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y) 
        };
        
        return Math.sqrt(Math.pow(point.x - projection.x, 2) + Math.pow(point.y - projection.y, 2));
    };
    public stageRef = React.createRef<any>();
    private socket!: Socket;

    constructor(props: BoardProps) {
        super(props);
        this.state = {
            shapes: [],
            isDrawing: false,
            currentPoints: [],
            mousePos: null,
            currentDragId: null,
            history: [[]], // Historique initial avec un tableau vide
            historyIndex: 0, // Commence à 0
        };
    }
    componentDidMount() {
        try {
            this.socket = io("localhost:6001", {
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000
            });
            this.socket.emit("join-channel", "default");
        this.socket.on("undo", (shapes: ShapeProps[]) => {
            this.setState({ shapes });
        });
        this.socket.on("redo", (shapes: ShapeProps[]) => {
            this.setState({ shapes });
        });

        this.socket.on("draw", (shape: ShapeProps) => {
            // Validate that shape is not null before processing
            if (!shape) return;
            
            this.setState(
                (prevState) => ({
                    shapes: prevState.shapes.some((s) => s && s.id === shape.id)
                        ? prevState.shapes
                        : [...prevState.shapes, shape],
                }),
                () => this.saveToHistory()
            );
        });

        this.socket.on(
            "shape-moved",
            (data: { id: string; x: number; y: number }) => {
                if (data.id === this.state.currentDragId) return;
                this.setState(
                    (prevState) => ({
                        shapes: prevState.shapes.map((shape) =>
                            shape.id === data.id
                                ? { ...shape, x: data.x, y: data.y }
                                : shape
                        ),
                    }),
                    () => this.saveToHistory()
                );
            }
        );

        this.socket.on("clear", () => {
            this.setState({ shapes: [], currentDragId: null }, () =>
                this.saveToHistory()
            );
        });

        this.socket.on("load-drawings", (shapes: ShapeProps[]) => {
            this.setState({ shapes }, () => this.saveToHistory());
        });

        this.saveToHistory();

        document.addEventListener("keydown", this.handleKeyDown);
        } catch (error) {
            console.error("Socket connection error:", error);
        }
    }

    componentWillUnmount(): void {
        if (this.socket) {
            this.socket.disconnect();
        }

        document.removeEventListener("keydown", this.handleKeyDown);
    }

    componentDidUpdate(prevProps: BoardProps) {
        if (this.props.shape !== prevProps.shape) {
            const stage = this.stageRef.current;
            if (stage) {
                if (this.props.shape === "hand") {
                    stage.container().style.cursor = "grab";
                } else if (this.props.shape === "eraser") {
                    stage.container().style.cursor = "crosshair";
                } else {
                    stage.container().style.cursor = "default";
                }
            }
        }
    }

    private saveToHistory = (): void => {
        const { history, historyIndex, shapes } = this.state;

        const newHistory = history.slice(0, historyIndex + 1);

        const lastState = newHistory[newHistory.length - 1] || [];
        const statesAreEqual =
            lastState.length === shapes.length &&
            lastState.every((shape, index) => {
                const currentShape = shapes[index];
                // Add null checks to prevent errors
                if (!shape || !currentShape) return false;
                
                return (
                    shape.id === currentShape.id &&
                    shape.x === currentShape.x &&
                    shape.y === currentShape.y
                );
            });

        if (!statesAreEqual) {
            // Filter out any null or undefined shapes before saving to history
            const validShapes = shapes.filter(shape => shape !== null && shape !== undefined);
            newHistory.push([...validShapes]);

            this.setState({
                history: newHistory,
                historyIndex: newHistory.length - 1,
            });
        }
    };

    public undo = (): void => {
        this.setState((prevState) => {
            if (prevState.historyIndex <= 0) return null; // Ne peut pas undo plus loin

            const newIndex = prevState.historyIndex - 1;
            const newShapes = [...prevState.history[newIndex]];

            this.socket.emit("undo", { channel: "default", shapes: newShapes });

            return {
                shapes: newShapes,
                historyIndex: newIndex,
            };
        });
    };

    public redo = (): void => {
        this.setState((prevState) => {
            if (prevState.historyIndex >= prevState.history.length - 1)
                return null;

            const newIndex = prevState.historyIndex + 1;
            const newShapes = [...prevState.history[newIndex]];

            this.socket.emit("redo", { channel: "default", shapes: newShapes });

            return {
                shapes: newShapes,
                historyIndex: newIndex,
            };
        });
    };

    addShape = (shape: ShapeProps): void => {
        this.setState(
            (prevState) => ({
                shapes: [...prevState.shapes, shape],
            }),
            () => {
                this.saveToHistory();
                this.socket.emit("draw", { channel: "default", shape: shape });
            }
        );
    };

    private handleKeyDown = (event: KeyboardEvent): void => {
        // Vérifier si Ctrl+Z (ou Cmd+Z sur Mac) est pressé pour undo
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "z" &&
            !event.shiftKey
        ) {
            // Empêcher le comportement par défaut du navigateur
            event.preventDefault();

            // Appeler la fonction d'annulation
            this.undo();
        }

        // Vérifier si Ctrl+Y ou Ctrl+Shift+Z est pressé pour redo
        if (
            (event.ctrlKey || event.metaKey) &&
            (event.key === "y" || (event.key === "z" && event.shiftKey))
        ) {
            // Empêcher le comportement par défaut du navigateur
            event.preventDefault();

            // Appeler la fonction de rétablissement
            this.redo();
        }
    };

    handleMouseDown = (e: KonvaEventObject<MouseEvent>): void => {
        if (this.props.shape === "hand") {
            const stage = this.stageRef.current;
            if (stage) {
                stage.container().style.cursor = "grabbing";
            }
            return;
        }

        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        this.setState({
            isDrawing: true,
            currentPoints: [pos.x, pos.y],
        });
    };

    handleMouseMove = (e: KonvaEventObject<MouseEvent>): void => {
        if (this.props.shape === "hand") {
            return;
        }

        if (!this.state.isDrawing) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        if (this.props.shape === "rectangle" || this.props.shape === "circle") {
            this.setState({
                currentPoints: [
                    this.state.currentPoints[0],
                    this.state.currentPoints[1],
                    point.x,
                    point.y,
                ],
            });
        } else if (this.props.shape === "freeform") {
            this.setState((prevState) => ({
                currentPoints: [...prevState.currentPoints, point.x, point.y],
            }));
        } else if (this.props.shape === "eraser") {
            // For eraser, check if it intersects with any shape and remove it
            this.setState((prevState) => {
                // Check if the eraser touches any shape
                const shapesToKeep = prevState.shapes.filter(shape => {
                    if (!shape) return false; // Skip null/undefined shapes
                    
                    // Check if the point is within the shape's bounds
                    if (shape.type === "rectangle") {
                        // Make sure all required properties exist
                        if (shape.x === undefined || shape.y === undefined || 
                            shape.width === undefined || shape.height === undefined) {
                            return true; // Keep shapes with missing properties
                        }
                        
                        return !(
                            point.x >= shape.x && 
                            point.x <= shape.x + shape.width && 
                            point.y >= shape.y && 
                            point.y <= shape.y + shape.height
                        );
                    } else if (shape.type === "circle") {
                        // Make sure all required properties exist
                        if (shape.x === undefined || shape.y === undefined || 
                            shape.width === undefined || shape.height === undefined) {
                            return true; // Keep shapes with missing properties
                        }
                        
                        const centerX = shape.x + shape.width / 2;
                        const centerY = shape.y + shape.height / 2;
                        const radius = Math.max(shape.width, shape.height) / 2;
                        const distance = Math.sqrt(
                            Math.pow(point.x - centerX, 2) + 
                            Math.pow(point.y - centerY, 2)
                        );
                        return distance > radius;
                    } else if (shape.type === "line" || shape.type === "freeform") {
                        // For lines and freeform, check if the point is close to any segment
                        if (!shape.points || shape.points.length < 2) return true;
                        
                        // Check proximity to line segments
                        for (let i = 0; i < shape.points.length - 2; i += 2) {
                            const x1 = shape.points[i];
                            const y1 = shape.points[i + 1];
                            const x2 = shape.points[i + 2];
                            const y2 = shape.points[i + 3];
                            
                            // Calculate distance from point to line segment
                            const distance = this.distanceToSegment(point, {x: x1, y: y1}, {x: x2, y: y2});
                            if (distance < this.props.penSize) {
                                return false; // Shape should be removed
                            }
                        }
                    } else if (shape.type === "image") {
                        // Make sure all required properties exist
                        if (shape.x === undefined || shape.y === undefined || 
                            shape.width === undefined || shape.height === undefined) {
                            return true; // Keep shapes with missing properties
                        }
                        
                        return !(
                            point.x >= shape.x && 
                            point.x <= shape.x + shape.width && 
                            point.y >= shape.y && 
                            point.y <= shape.y + shape.height
                        );
                    }
                    return true; // Keep the shape if no intersection
                });
                
                // If shapes were removed, notify other clients
                if (shapesToKeep.length < prevState.shapes.length) {
                    this.socket.emit("draw", {
                        channel: "default",
                        shapes: shapesToKeep,
                    });
                    // Save to history after removing shapes
                    this.saveToHistory();
                }
                
                return {
                    shapes: shapesToKeep,
                    currentPoints: [...prevState.currentPoints, point.x, point.y],
                };
            });
        } else if (this.props.shape === "line") {
            this.setState({
                currentPoints: [
                    this.state.currentPoints[0],
                    this.state.currentPoints[1],
                    point.x,
                    point.y,
                ],
            });
        }
    };

    handleMouseUp = (e: KonvaEventObject<MouseEvent>): void => {
        if (this.props.shape === "hand") {
            const stage = this.stageRef.current;
            if (stage) {
                stage.container().style.cursor = "grab";
            }
            return;
        }

        if (!this.state.isDrawing) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        this.setState({ isDrawing: false });

        // Don't create a new shape if using eraser
        if (this.props.shape === "eraser") {
            this.saveToHistory();
            return;
        }

        const id = Math.random().toString();
        const newShape: ShapeProps = {
            id,
            points: this.state.currentPoints,
            stroke: this.props.color,
            strokeWidth: this.props.penSize,
            type: this.props.shape as ShapeProps["type"],
            fill: this.props.isShapeFilled ? this.props.color : "transparent",
        };

        if (this.props.shape === "rectangle" || this.props.shape === "circle") {
            const startPoint = {
                x: this.state.currentPoints[0],
                y: this.state.currentPoints[1],
            };
            newShape.x = Math.min(startPoint.x, point.x);
            newShape.y = Math.min(startPoint.y, point.y);
            newShape.width = Math.abs(point.x - startPoint.x);
            newShape.height = Math.abs(point.y - startPoint.y);
            delete newShape.points;
        }

        this.setState(
            (prevState) => ({
                shapes: [...prevState.shapes, newShape],
            }),
            () => {
                this.saveToHistory();
                this.socket.emit("draw", {
                    channel: "default",
                    shape: newShape,
                });
            }
        );
    };

    handleDragStart = (_e: KonvaEventObject<DragEvent>, id: string): void => {
        if (this.props.shape !== "hand") return;
        this.setState({ currentDragId: id });
    };

    handleDragMove = (e: KonvaEventObject<DragEvent>, id: string) => {
        if (this.props.shape !== "hand") return;

        const shape = e.target;
        const newX = shape.x();
        const newY = shape.y();

        // Update position locally
        this.setState((prevState) => ({
            shapes: prevState.shapes.map((s) =>
                s.id === id ? { ...s, x: newX, y: newY } : s
            ),
        }));

        // Notify other clients
        this.socket.emit("shape-moved", { id, x: newX, y: newY });
    };

    handleDragEnd = (e: KonvaEventObject<DragEvent>, id: string) => {
        if (this.props.shape !== "hand") return;

        const shape = e.target;
        const newX = shape.x();
        const newY = shape.y();

        this.setState(
            (prevState) => ({
                shapes: prevState.shapes.map((s) =>
                    s.id === id ? { ...s, x: newX, y: newY } : s
                ),
                currentDragId: null,
            }),
            () => {
                this.saveToHistory();
                this.socket.emit("shape-moved", { id, x: newX, y: newY });
            }
        );
    };

    clearBoard = (): void => {
        this.setState(
            {
                shapes: [],
                currentDragId: null,
                history: [[]], // Réinitialiser avec un tableau vide
                historyIndex: 0,
            },
            () => {
                this.saveToHistory(); // Sauvegarde dans l'historique après nettoyage
                this.socket.emit("clear", "default");
            }
        );
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
                style={{ backgroundColor: "white" }}
            >
                <Layer>
                    {this.state.shapes.filter(shape => shape !== null && shape !== undefined).map((shape, i) => {
                        if (!shape) return null; // Extra safety check
                        
                        if (
                            shape.type === "freeform" ||
                            shape.type === "line"
                        ) {
                            if (!shape.points || shape.points.length < 2) return null;
                            
                            return (
                                <Line
                                    key={i}
                                    points={shape.points}
                                    stroke={shape.stroke}
                                    strokeWidth={shape.strokeWidth}
                                    tension={0.5}
                                    lineCap="round"
                                    globalCompositeOperation="source-over"
                                    draggable={this.props.shape === "hand"}
                                    onDragStart={(e) =>
                                        this.handleDragStart(e, shape.id)
                                    }
                                    onDragMove={(e) =>
                                        this.handleDragMove(e, shape.id)
                                    }
                                    onDragEnd={(e) =>
                                        this.handleDragEnd(e, shape.id)
                                    }
                                />
                            );
                        } else if (shape.type === "rectangle") {
                            if (shape.x === undefined || shape.y === undefined || 
                                shape.width === undefined || shape.height === undefined) {
                                return null; // Skip rendering if missing required properties
                            }
                            
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
                                    draggable={this.props.shape === "hand"}
                                    onDragStart={(e) =>
                                        this.handleDragStart(e, shape.id)
                                    }
                                    onDragMove={(e) =>
                                        this.handleDragMove(e, shape.id)
                                    }
                                    onDragEnd={(e) =>
                                        this.handleDragEnd(e, shape.id)
                                    }
                                />
                            );
                        } else if (shape.type === "circle") {
                            if (shape.x === undefined || shape.y === undefined || 
                                shape.width === undefined || shape.height === undefined) {
                                return null; // Skip rendering if missing required properties
                            }
                            
                            return (
                                <Circle
                                    key={i}
                                    x={shape.x + shape.width / 2}
                                    y={shape.y + shape.height / 2}
                                    radius={
                                        Math.max(shape.width, shape.height) /
                                        2
                                    }
                                    stroke={shape.stroke}
                                    strokeWidth={shape.strokeWidth}
                                    fill={shape.fill}
                                    draggable={this.props.shape === "hand"}
                                    onDragStart={(e) =>
                                        this.handleDragStart(e, shape.id)
                                    }
                                    onDragMove={(e) =>
                                        this.handleDragMove(e, shape.id)
                                    }
                                    onDragEnd={(e) =>
                                        this.handleDragEnd(e, shape.id)
                                    }
                                />
                            );
                        } else if (shape.type === "image" && shape.image) {
                            if (shape.x === undefined || shape.y === undefined || 
                                shape.width === undefined || shape.height === undefined) {
                                return null; // Skip rendering if missing required properties
                            }
                            
                            return (
                                <Image
                                    key={i}
                                    x={shape.x}
                                    y={shape.y}
                                    width={shape.width}
                                    height={shape.height}
                                    image={shape.image}
                                    draggable={this.props.shape === "hand"}
                                    onDragStart={(e) =>
                                        this.handleDragStart(e, shape.id)
                                    }
                                    onDragMove={(e) =>
                                        this.handleDragMove(e, shape.id)
                                    }
                                    onDragEnd={(e) =>
                                        this.handleDragEnd(e, shape.id)
                                    }
                                />
                            );
                        }
                        return null;
                    })}
                    {this.state.isDrawing && (
                        <>
                            {(this.props.shape === "freeform" ||
                                this.props.shape === "line") && (
                                <Line
                                    points={this.state.currentPoints}
                                    stroke={this.props.color}
                                    strokeWidth={this.props.penSize}
                                    tension={0.5}
                                    lineCap="round"
                                    globalCompositeOperation="source-over"
                                />
                            )}
                            {this.props.shape === "eraser" && (
                                <Circle
                                    x={this.state.currentPoints[this.state.currentPoints.length - 2] || 0}
                                    y={this.state.currentPoints[this.state.currentPoints.length - 1] || 0}
                                    radius={this.props.penSize / 2}
                                    stroke="#999"
                                    strokeWidth={1}
                                    dash={[2, 2]}
                                    fill="rgba(200, 200, 200, 0.3)"
                                />
                            )}
                            {this.props.shape === "rectangle" &&
                                this.state.currentPoints.length >= 2 && (
                                    <Rect
                                        x={Math.min(
                                            this.state.currentPoints[0],
                                            this.state.currentPoints[2] ||
                                                this.state.currentPoints[0]
                                        )}
                                        y={Math.min(
                                            this.state.currentPoints[1],
                                            this.state.currentPoints[3] ||
                                                this.state.currentPoints[1]
                                        )}
                                        width={Math.abs(
                                            (this.state.currentPoints[2] ||
                                                this.state.currentPoints[0]) -
                                                this.state.currentPoints[0]
                                        )}
                                        height={Math.abs(
                                            (this.state.currentPoints[3] ||
                                                this.state.currentPoints[1]) -
                                                this.state.currentPoints[1]
                                        )}
                                        stroke={this.props.color}
                                        strokeWidth={this.props.penSize}
                                        fill={
                                            this.props.isShapeFilled
                                                ? this.props.color
                                                : "transparent"
                                        }
                                    />
                                )}
                            {this.props.shape === "circle" &&
                                this.state.currentPoints.length >= 2 && (
                                    <Circle
                                        x={Math.min(
                                            this.state.currentPoints[0],
                                            this.state.currentPoints[2] ||
                                                this.state.currentPoints[0]
                                        ) + Math.abs(
                                            (this.state.currentPoints[2] ||
                                                this.state.currentPoints[0]) -
                                                this.state.currentPoints[0]
                                        ) / 2}
                                        y={Math.min(
                                            this.state.currentPoints[1],
                                            this.state.currentPoints[3] ||
                                                this.state.currentPoints[1]
                                        ) + Math.abs(
                                            (this.state.currentPoints[3] ||
                                                this.state.currentPoints[1]) -
                                                this.state.currentPoints[1]
                                        ) / 2}
                                        radius={Math.max(
                                            Math.abs(
                                                (this.state.currentPoints[2] ||
                                                    this.state.currentPoints[0]) -
                                                    this.state.currentPoints[0]
                                            ),
                                            Math.abs(
                                                (this.state.currentPoints[3] ||
                                                    this.state.currentPoints[1]) -
                                                    this.state.currentPoints[1]
                                            )
                                        ) / 2}
                                        stroke={this.props.color}
                                        strokeWidth={this.props.penSize}
                                        fill={
                                            this.props.isShapeFilled
                                                ? this.props.color
                                                : "transparent"
                                        }
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
