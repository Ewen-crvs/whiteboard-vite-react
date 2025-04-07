// Using the global HTMLImageElement type

export interface Point {
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
    imageDataUrl?: string; // For image data transmission over sockets
}

export interface BoardProps {
    shape: "line" | "rectangle" | "circle" | "freeform" | "eraser" | "hand";
    color: string;
    penSize: number;
    isShapeFilled: boolean;
}

export interface BoardState {
    shapes: ShapeProps[];
    isDrawing: boolean;
    currentPoints: number[];
    mousePos: Point | null;
    currentDragId: string | null;
    history: ShapeProps[][]; // For storing history
    historyIndex: number; // Current index in history
}

export interface ContainerProps {}

export interface ContainerState {
    color: string;
    shape: "line" | "rectangle" | "circle" | "freeform" | "eraser" | "hand";
    penSize: number;
    isShapeFilled: boolean;
}
