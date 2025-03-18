import React, { ReactElement } from 'react';
import { io, Socket } from 'socket.io-client';

import './style.css';

interface BoardProps {
    color: string;
    shape: 'line' | 'rectangle' | 'circle' | 'freeform';
    penSize: number;
    isShapeFilled: boolean;
}

interface BoardState {}

interface MousePosition {
    x: number;
    y: number;
}

class Board extends React.Component<BoardProps, BoardState> {
    private canvasRef = React.createRef<HTMLCanvasElement>();
    timeout: NodeJS.Timeout | null = null;
    socket: Socket = io("10.26.129.232:3000");
    ctx: CanvasRenderingContext2D | null = null;
    isDrawing: boolean = false;
    startPos: MousePosition = { x: 0, y: 0 };
    lastPos: MousePosition = { x: 0, y: 0 };
    baseImageData: ImageData | null = null;

    constructor(props: BoardProps) {
        super(props);

        this.socket.on("canvas-data", (data: string) => {
            const image = new Image();
            const canvas = this.canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            image.onload = () => {
                ctx.drawImage(image, 0, 0);
            };
            image.src = data;
        });
    }

    componentDidMount(): void {
        this.setupCanvas();
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

    clearBoard = (): void => {
        if (!this.ctx || !this.canvasRef.current) return;
        const canvas = this.canvasRef.current;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const base64ImageData = canvas.toDataURL("image/png");
        this.socket.emit("canvas-data", base64ImageData);
    }

    getMousePos = (e: MouseEvent): MousePosition => {
        const canvas = this.canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Allow drawing slightly outside canvas bounds
        const margin = 100; // pixels
        return {
            x: Math.max(-margin, Math.min(canvas.width + margin, x)),
            y: Math.max(-margin, Math.min(canvas.height + margin, y))
        };
    };

    drawShape(currentPos: MousePosition): void {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.beginPath();

        switch (this.props.shape) {
            case 'line':
                ctx.moveTo(this.startPos.x, this.startPos.y);
                ctx.lineTo(currentPos.x, currentPos.y);
                ctx.stroke();
                break;
            case 'rectangle': {
                const width = currentPos.x - this.startPos.x;
                const height = currentPos.y - this.startPos.y;
                if (this.props.isShapeFilled) {
                    ctx.fillRect(this.startPos.x, this.startPos.y, width, height);
                } else {
                    ctx.strokeRect(this.startPos.x, this.startPos.y, width, height);
                }
                break;
            }
            case 'circle': {
                const radius = Math.sqrt(
                    Math.pow(currentPos.x - this.startPos.x, 2) + 
                    Math.pow(currentPos.y - this.startPos.y, 2)
                );
                ctx.arc(this.startPos.x, this.startPos.y, radius, 0, 2 * Math.PI);
                if (this.props.isShapeFilled) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
                break;
            }
            case 'freeform':
                ctx.moveTo(this.startPos.x, this.startPos.y);
                ctx.lineTo(currentPos.x, currentPos.y);
                ctx.stroke();
                this.startPos = { ...currentPos };
                break;
        }

        ctx.closePath();
    }

    finishDrawing = (): void => {
        if (!this.isDrawing || !this.ctx || !this.canvasRef.current) return;

        if (this.props.shape !== 'freeform') {
            const currentPos = this.lastPos;

            if (this.baseImageData) {
                this.ctx.putImageData(this.baseImageData, 0, 0);
                this.drawShape(currentPos);
            }
        }

        this.isDrawing = false;
        this.baseImageData = null;

        if (this.timeout !== null) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            if (!this.canvasRef.current) return;
            const base64ImageData = this.canvasRef.current.toDataURL("image/png");
            this.socket.emit("canvas-data", base64ImageData);
        }, 10);
    };

    setupCanvas(): void {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        this.ctx = canvas.getContext('2d');
        if (!this.ctx) return;

        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            this.ctx!.lineWidth = this.props.penSize;
            this.ctx!.lineJoin = 'round';
            this.ctx!.lineCap = 'round';
            this.ctx!.strokeStyle = this.props.color;
            this.ctx!.fillStyle = this.props.color;
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        // Add canvas-level event listeners
        canvas.addEventListener('mousedown', this.handleMouseDown);

        // Add window-level event listeners for continuous drawing
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
    }

    handleMouseDown = (e: MouseEvent): void => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        this.isDrawing = true;
        this.startPos = this.getMousePos(e);
        this.lastPos = this.startPos;

        if (this.ctx) {
            this.baseImageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
    };

    handleMouseMove = (e: MouseEvent): void => {
        if (!this.isDrawing || !this.ctx || !this.canvasRef.current) return;
        
        const currentPos = this.getMousePos(e);
        this.lastPos = currentPos;

        if (this.props.shape === 'freeform') {
            this.drawShape(currentPos);
        } else if (this.baseImageData) {
            this.ctx.putImageData(this.baseImageData, 0, 0);
            this.drawShape(currentPos);
        }
    };

    handleMouseUp = (): void => {
        this.finishDrawing();
    };

    componentWillUnmount(): void {
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('resize', this.setupCanvas);
    }

    render(): ReactElement {
        return (
            <div id="sketch" className="sketch">
                <canvas ref={this.canvasRef} className="board"></canvas>
            </div>
        );
    }
}

export default Board;