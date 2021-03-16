CanvasRenderingContext2D.prototype.clear = function(){
    this.fillStyle = "white"
    this.fillRect(0, 0, $(this.canvas).width(), $(this.canvas).height())
    this.fillStyle = "black"
}

class Paper{

    constructor(cvs, mode){
        if (!(cvs instanceof HTMLCanvasElement)){
            throw Error("Usage: new Paper(canvas_element)")
        }

        this.cvs = $(cvs)
        this.ctx = cvs.getContext("2d")

        this.drawing = false
        this.lastx = this.lasty = 0
        this.mode = mode || "Hiragana"

        this.events = {
            "recognized": null
        }

        const mousedown = (e) => {
            let offsetX, offsetY
            if (e.touches){
                offsetX = e.touches[0].clientX - this.cvs.offset().left
                offsetY = e.touches[0].clientY - this.cvs.offset().top
            } else {
                offsetX = e.offsetX
                offsetY = e.offsetY
            }
        
            this.drawing = true
            this.lastx = offsetX
            this.lasty = offsetY
        }

        const mouseup = () => {
            if (this.drawing){
                this.drawing = false
                const data = this.cvs[0].toDataURL()
        
                fetch("/recognize", {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "drawing": data,
                        "type": this.mode
                    }),
                    method: "POST"
                })
                .then(rep => rep.text())
                .then((guesses) => {
                    guesses = JSON.parse(guesses)
                    
                    if (this.events.recognized)
                        this.events.recognized(guesses)
                })
            }
        }
        
        const mousemove = (e) => {
            e.preventDefault()
        
            if (this.drawing){
                let offsetX, offsetY
                if (e.touches){
                    offsetX = e.touches[0].clientX - this.cvs.offset().left
                    offsetY = e.touches[0].clientY - this.cvs.offset().top
                } else {
                    offsetX = e.offsetX
                    offsetY = e.offsetY
                }
        
                this.ctx.beginPath()
                this.ctx.arc(this.lastx, this.lasty, 3, 0, 2 * Math.PI)
                this.ctx.fill()
        
                this.ctx.lineWidth = 6
                this.ctx.beginPath()
                this.ctx.moveTo(this.lastx, this.lasty)
                this.ctx.lineTo(offsetX, offsetY)
                this.ctx.stroke()
        
                this.ctx.beginPath()
                this.ctx.arc(offsetX, offsetY, 3, 0, 2 * Math.PI)
                this.ctx.fill()
        
                this.lastx = offsetX
                this.lasty = offsetY
            }
        }

        this.cvs.on("mousedown", mousedown)
        $(document).on("mouseup", mouseup)
        this.cvs.on("mousemove", mousemove)
        this.cvs.on("touchstart", mousedown)
        this.cvs.on("touchmove", mousemove)
        this.cvs.on("touchend", mouseup)
    }

    on(event, callback){
        if (event in this.events){
            this.events[event] = callback
        }
    }

    clear(){
        this.ctx.clear()
    }

}