class DrawCommand{
    constructor(points){
        // Stores the array of points that make up one freehand stroke.
        // Each point is an object {x: number, y: number}
        this.points = points;
    }

    execute(context){
        // If there are fewer than 2 points, nothing meaningful to draw.
        if(this.points.length < 2) return;

        // Begin a new path so this stroke doesn't connect to previous drawings.
        context.beginPath();

        // Move the "pen" to the first point of the stroke.
        context.moveTo(this.points[0].x, this.points[0].y);

        // Draw straight segments from point to point.
        for(let i = 1; i < this.points.length; i++){
            context.lineTo(this.points[i].x, this.points[i].y);
        }
        
        // Actually paint the outline of the path onto the canvas.
        context.stroke();
    }
}