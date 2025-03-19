import React, { ReactElement } from 'react';
import { io, Socket } from 'socket.io-client';
import './style.css';

interface BoardProps {
    color: string;
    shape: 'line' | 'rectangle' | 'circle' | 'freeform';
    penSize: number;
    isShapeFilled: boolean;
}

interface MousePosition {
    x: number;
    y: number;
}

interface DrawingData {
    shape: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    penSize: number;
    isFilled: boolean;
}

class Board extends React.Component<BoardProps> {
    private canvasRef = React.createRef<HTMLCanvasElement>();
    socket: Socket = io("localhost:3001", {
        transports: ["websocket"],
    });
    ctx: CanvasRenderingContext2D | null = null;
    isDrawing: boolean = false;
    startPos: MousePosition = { x: 0, y: 0 };
    lastPos: MousePosition = { x: 0, y: 0 };
    baseImageData: ImageData | null = null;

    constructor(props: BoardProps) {
        super(props);

        this.socket.on("load-drawings", (drawings: DrawingData[]) => {
            this.clearBoard(false);
            drawings.forEach((data) => this.drawShape(data));
        });

        this.socket.on("draw", (data: DrawingData) => {
            this.drawShape(data);
        });

        this.socket.on("clear", () => {
            this.clearBoard(false);
        });
    }

    componentDidMount(): void {
        this.setupCanvas();
        window.addEventListener('resize', this.handleResize);
    }

    componentDidUpdate(prevProps: BoardProps): void {
        if (!this.ctx) return;
        
        if (prevProps.color !== this.props.color) {
            this.ctx.strokeStyle = this.props.color;
            this.ctx.fillStyle = this.props.color;
        }
        if (prevProps.penSize !== this.props.penSize) {
            this.ctx.lineWidth = this.props.penSize;
        }
    }

    handleResize = (): void => {
        const canvas = this.canvasRef.current;
        if (!canvas || !this.ctx) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        this.ctx.lineWidth = this.props.penSize;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.props.color;
        this.ctx.fillStyle = this.props.color;
    };

    clearBoard = (emit: boolean = true): void => {
        if (!this.ctx || !this.canvasRef.current) return;
        this.ctx.clearRect(
            0,
            0,
            this.canvasRef.current.width,
            this.canvasRef.current.height
        );
        if (emit) this.socket.emit("clear");
    };

    getMousePos = (e: MouseEvent): MousePosition => {
        const canvas = this.canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    drawShape(data: DrawingData): void {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.penSize;
        ctx.fillStyle = data.color;

        switch (data.shape) {
            case "line":
                ctx.moveTo(data.startX, data.startY);
                ctx.lineTo(data.endX, data.endY);
                ctx.stroke();
                break;

            case "rectangle":
                if (data.isFilled) {
                    ctx.fillRect(
                        data.startX,
                        data.startY,
                        data.endX - data.startX,
                        data.endY - data.startY
                    );
                } else {
                    ctx.strokeRect(
                        data.startX,
                        data.startY,
                        data.endX - data.startX,
                        data.endY - data.startY
                    );
                }
                break;

            case "circle":
                const radius = Math.sqrt(
                    Math.pow(data.endX - data.startX, 2) +
                    Math.pow(data.endY - data.startY, 2)
                );
                ctx.arc(data.startX, data.startY, radius, 0, 2 * Math.PI);
                if (data.isFilled) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
                break;

            case "freeform":
                ctx.moveTo(data.startX, data.startY);
                ctx.lineTo(data.endX, data.endY);
                ctx.stroke();
                break;
        }
        ctx.closePath();
    }

    finishDrawing = (): void => {
        if (!this.isDrawing || !this.ctx) return;
        this.isDrawing = false;

        if (this.props.shape !== "freeform") {
            this.socket.emit("draw", {
                shape: this.props.shape,
                startX: this.startPos.x,
                startY: this.startPos.y,
                endX: this.lastPos.x,
                endY: this.lastPos.y,
                color: this.props.color,
                penSize: this.props.penSize,
                isFilled: this.props.isShapeFilled,
            });
        }
    };

    setupCanvas(): void {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        this.ctx = canvas.getContext("2d");
        if (!this.ctx) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        this.ctx.lineWidth = this.props.penSize;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.props.color;
        this.ctx.fillStyle = this.props.color;

        canvas.addEventListener("mousedown", this.handleMouseDown);
        canvas.addEventListener("mousemove", this.handleMouseMove);
        canvas.addEventListener("mouseup", this.handleMouseUp);
    }

    handleMouseDown = (e: MouseEvent): void => {
        this.isDrawing = true;
        this.startPos = this.getMousePos(e);
        this.lastPos = this.startPos;

        if (this.ctx && this.canvasRef.current) {
            this.baseImageData = this.ctx.getImageData(
                0,
                0,
                this.canvasRef.current.width,
                this.canvasRef.current.height
            );
        }
    };

    handleMouseMove = (e: MouseEvent): void => {
        if (!this.isDrawing || !this.ctx) return;
        this.lastPos = this.getMousePos(e);

        if (this.props.shape === "freeform") {
            this.drawShape({
                shape: "freeform",
                startX: this.startPos.x,
                startY: this.startPos.y,
                endX: this.lastPos.x,
                endY: this.lastPos.y,
                color: this.props.color,
                penSize: this.props.penSize,
                isFilled: false,
            });
            
            this.socket.emit("draw", {
                shape: "freeform",
                startX: this.startPos.x,
                startY: this.startPos.y,
                endX: this.lastPos.x,
                endY: this.lastPos.y,
                color: this.props.color,
                penSize: this.props.penSize,
                isFilled: false,
            });
            
            this.startPos = { ...this.lastPos };
        } else if (this.baseImageData) {
            this.ctx.putImageData(this.baseImageData, 0, 0);
            this.drawShape({
                shape: this.props.shape,
                startX: this.startPos.x,
                startY: this.startPos.y,
                endX: this.lastPos.x,
                endY: this.lastPos.y,
                color: this.props.color,
                penSize: this.props.penSize,
                isFilled: this.props.isShapeFilled,
            });
        }
    };

    handleMouseUp = (): void => {
        this.finishDrawing();
    };

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.handleResize);
        const canvas = this.canvasRef.current;
        if (canvas) {
            canvas.removeEventListener("mousedown", this.handleMouseDown);
            canvas.removeEventListener("mousemove", this.handleMouseMove);
            canvas.removeEventListener("mouseup", this.handleMouseUp);
        }
    }

    render(): ReactElement {
        return (
            <div id="sketch" className="sketch" style={{ width: '100%', height: '100%' }}>
                <canvas ref={this.canvasRef} style={{ width: '100%', height: '100%', border: '1px solid #ccc' }} />
            </div>
        );
    }
}

export default Board;
