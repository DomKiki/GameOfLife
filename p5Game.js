var p5Game = function(p) {

    var gridSize = { h: 50, w: 50, d: 0 },
        grid,
        tileSize = 10,
        neighbourhoodRadius = 1;

    var thresholds = { death: 2, neutral: 2, life: 3 };

    var easycam,
        Controls, ctrl, gui,
        btnPause, paused = false;

    var backgroundColor;

    p.setup = function() {

        var canvas = p.createCanvas(800, 800, p.WEBGL);
        backgroundColor = p.color("#e6ffff");
        
        // fix for EasyCam to work with p5 v0.7.2
        Dw.EasyCam.prototype.apply = function(n) {
            var o = this.cam;
            n = n || o.renderer,
            n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
	    };
        p.pixelDensity(1);
        p.setAttributes('antialias', true);
        easycam = p.createEasyCam({distance: 800});

        grid = p.initGrid(gridSize, 0.3);
        p.initGUI();

    }

    p.windowResized = function() { easycam.setViewport([0, 0, p.width, p.height]); }

    p.draw = function() {

        p.frameRate(ctrl.fps);
        p.rotateX(10);
        p.background(backgroundColor);
        p.strokeWeight(1);
        
        grid = p.iterate(grid);
        p.drawGrid();

    }

    p.iterate = function(gr) {

        let g = p.initGrid(gridSize, 0);
        for (let i = 0; i < g.length; i++)
            for (let j = 0; j < g[i].length; j++) {
                let n = p.neighbourhood(gr,i,j);
                if ((n < thresholds.death) || (n > thresholds.life))
                    g[i][j] = 0;
                else if (n == thresholds.life)
                    g[i][j] = 1;
                else if (n == thresholds.neutral)
                    g[i][j] = gr[i][j];
            }
        return g;
    }

    p.neighbourhood = function(g,x,y) {

        let n = 0;
        for (let i = (x - neighbourhoodRadius); i <= (x + neighbourhoodRadius); i++)
            for (let j = (y - neighbourhoodRadius); j <= (y + neighbourhoodRadius); j++)
                if ((i != x) || (j != y)) {
                    let r = p.modulus(i, gridSize.h);
                    let c = p.modulus(j, gridSize.w);
                    if (g[r][c] == 1)
                        n++;
                }
        return n;

    }

    p.initGrid = function(gridSize, r) {
        let g = [];
        for (let i = 0; i < gridSize.h; i++)
            g.push(new Array(gridSize.w).fill(0));
        return p.randomizeGrid(g, r);
    }

    p.resizeGrid = function(gr, ctrl) {

        // Grid
        let g = gr.slice();
        // X
        while (g.length != ctrl.h)
            if (g.length < ctrl.h)
                g.push(new Array(ctrl.w).fill(0));
            else
                g.pop();
        gridSize.h = ctrl.h;
        // Y
        for (let i = 0; i < g.length; i++)
        while (g[i].length != ctrl.w)
            if (g[i].length < ctrl.w)
                g[i].push(0);
            else
                g[i].pop();
        gridSize.w = ctrl.w;

        // Camera
        easycam.setDistance(p.max([ctrl.w, ctrl.h, ctrl.d]) * 15);

        return g;
    }

    p.randomizeGrid = function(g,r) {
        let gr = g.slice();
        for (let i = 0; i < g.length; i++)
            for (let j = 0; j < g[i].length; j++)
                if (p.random(1) < r)
                    g[i][j] = 1;
        return gr;
    }

    p.drawGrid = function() {
        p.translate(-0.5 * gridSize.w * tileSize, -0.5 * gridSize.h * tileSize);
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                let color  = (grid[i][j] == 1) ? p.color(0) : p.color(255);
                p.fill(color);
                p.translate(tileSize, 0, 0);
                p.box(tileSize);
            }
            p.translate(-tileSize * gridSize.w, tileSize, 0);
        }
    }

    p.modulus = function(a,b) { return (a + b) % b; }

    p.pauseResume = function() {
        paused = !paused;
        if (paused) 
            p.noLoop();
        else
            p.loop();
        btnPause.name((paused) ? "Resume" : "Pause");
    }

    p.reset = function() {
        grid = p.initGrid(gridSize, ctrl.population);
        p.translate(0.5 * gridSize.w * tileSize, -0.5 * gridSize.h * tileSize);
        p.drawGrid();
    }

    p.initGUI = function() {

        // Controls
        Controls = function() {
            this.w           = gridSize.w;
            this.h           = gridSize.h;
            this.d           = gridSize.d;
            this.test ="--------------------";
            this.nghbrRadius = 1;
            this.deathThresh = 2;
            this.neutral     = 2;
            this.lifeThresh  = 3;
            this.population  = 0.3;
            this.fps         = 30;
            this.pauseResume = function() { p.pauseResume(); }
            this.reset       = function() { p.reset(); };
        };
        ctrl = new Controls();

        gui  = new dat.GUI();
        // Grid dimensions Sliders
        gui.add(ctrl, "w", 0, 100, 1)
           .name("Grid width")
           .onChange(function(value) {
                ctrl.w = value;
                grid   = p.resizeGrid(grid, ctrl);
            });
        gui.add(ctrl, "h", 0, 100, 1)
           .name("Grid height")
           .onChange(function(value) {
                ctrl.h = value;
                grid   = p.resizeGrid(grid, ctrl);
            });
        gui.add(ctrl, "d", 0, 100, 1)
           .name("Grid depth")
           .onChange(function(value) {
                ctrl.d = value;
                grid   = p.resizeGrid(grid, ctrl);
            });

        // Rules
        gui.add(ctrl, "nghbrRadius", 1, 5, 1)
           .name("Neighbourhood")
           .onChange(function(value) { neighbourhoodRadius = value; });
        gui.add(ctrl, "deathThresh", 0, 20, 1)
           .name("Death Threshold")
           .onChange(function(value) { thresholds.death = value; });
        gui.add(ctrl, "neutral", 0, 20, 1)
           .name("Neutral")
           .onChange(function(value) { thresholds.neutral = value; });
        gui.add(ctrl, "lifeThresh", 0, 20, 1)
           .name("Life Threshold")
           .onChange(function(value) { thresholds.life = value; });

        // Simulation control
        gui.add(ctrl, "fps", 1, 60).name("Max FpS");
        btnPause = gui.add(ctrl, "pauseResume").name("Pause");
        gui.add(ctrl, "population", 0, 1).name("Population Ratio");
        gui.add(ctrl, "reset").name("Reset");

    }

}