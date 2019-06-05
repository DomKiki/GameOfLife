var p5Game = function(p) {

    const CAMERA = 0,
          BRUSH  = 1;
    var   state  = CAMERA;

    var gridSize = { h: 10, w: 10, d: 3 },
        grid,
        tileSize = 20,
        neighbourhoodRadius = 1;

    var rules = { birth: [4/*3*/], survive: [9/*2,3*/] };

    var easycam, camState,
        Controls, ctrl, gui,
        btnPause, paused = false,
        btnBrush;

    var backgroundColor;

    /********************************************************** p5 *********************************************************/

    p.setup = function() {

        var canvas = p.createCanvas(800, 800, p.WEBGL);
        backgroundColor = p.color("#e6ffff");
        
        grid = p.initGrid(gridSize, 0.3);

        // fix for EasyCam to work with p5 v0.7.2
        Dw.EasyCam.prototype.apply = function(n) {
            var o = this.cam;
            n = n || o.renderer,
            n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
	    };
        p.pixelDensity(1);
        p.setAttributes('antialias', true);

        easycam = p.createEasyCam({distance: 800});
        p.initGUI();
        p.enableCamera(true);

        p.reset();

    }

    p.windowResized = function() { easycam.setViewport([0, 0, p.width, p.height]); }

    p.draw = function() {

        p.frameRate(ctrl.fps);
        p.rotateX(10);
        p.background(backgroundColor);
        p.strokeWeight(0.5);
        
        grid = p.iterate(grid);
        p.drawGrid();

    }

    /********************************************************* Game ********************************************************/

    p.iterate = function(gr) {

        let g = p.initGrid(gridSize, 0);
        for (let i = 0; i < g.length; i++)
            for (let j = 0; j < g[i].length; j++) 
                for (let k = 0; k < g[i][j].length; k++) {
                    let n = p.neighbourhood(gr,i,j,k);
                    if (rules.birth.includes(n))
                        g[i][j][k] = 1;
                    else if (rules.survive.includes(n))
                        g[i][j][k] = gr[i][j][k];
                    else
                        g[i][j][k] = 0;
            }
        return g;
    }

    p.neighbourhood = function(g,x,y,z) {

        let n = 0,
            checked = p.initGrid(gridSize, 0);
        for (let i = (x - neighbourhoodRadius); i <= (x + neighbourhoodRadius); i++)
            for (let j = (y - neighbourhoodRadius); j <= (y + neighbourhoodRadius); j++)
                for (let k = (z - neighbourhoodRadius); k <= (z + neighbourhoodRadius); k++) {
                    let row = p.modulus(i, gridSize.h);
                    let col = p.modulus(j, gridSize.w);
                    let dep = p.modulus(k, gridSize.d);
                    if ((g[row][col][dep] == 1) && (checked[row][col][dep] != 1))
                        if ((row != x) || (col != y) || (dep != z))
                            n++;
                    checked[row][col][dep] = 1;
                }
        return n;

    }

    p.updateRuleSet = function(rs) {

        let bs  = rs.split("/"),
            res = { birth: [], survive: [] };

        if (bs.length != 2)
            return;

        for (let i = 0; i < bs.length; i++) {

            let t   = bs[i].charAt(0),
                arr = [];
            for (let j = 1; j < bs[i].length; j++) {
                let c = parseInt(bs[i].charAt(j));
                if ((!arr.includes(c)) && (!isNaN(c)))
                    arr.push(c);
            }

            if      (t == 'B') res.birth   = arr;
            else if (t == 'S') res.survive = arr;
        }

        if ((res.birth.length > 0) && (res.survive.length > 0))
            rules = res;

    }

    p.ruleSetString = function() {
        let b = "",
            s = "";
        for (let v of rules.birth)   b += String(v);
        for (let v of rules.survive) s += String(v);
        return "B" + b + "/S" + s;
    }

    /********************************************************* Grid ********************************************************/

    p.initGrid = function(gridSize, r) {
        let g = [];
        for (let i = 0; i < gridSize.h; i++) {
            let arrY = [];
            for (let j = 0; j < gridSize.w; j++) {
                let arrZ = [];
                for (let k = 0; k < gridSize.d; k++)
                    arrZ.push(0);
                arrY.push(arrZ);
            }
            g.push(arrY);
        }

        return p.randomizeGrid(g, r);
    }
    
    p.randomizeGrid = function(g,r) {
        let gr = g.slice();
        for (let i = 0; i < g.length; i++)
            for (let j = 0; j < g[i].length; j++)
                for (let k = 0; k < g[i][j].length; k++)
                    if (p.random() < r)
                        g[i][j][k] = 1;
        return gr;
    }

    p.resizeGrid = function(gr, ctrl) {
        
        // Grid
        let g = gr.slice();
        // X
        while (g.length != ctrl.h)
            if (g.length < ctrl.h) g.push([]);
            else g.pop();
        // Y
        for (let i = 0; i < g.length; i++) {
            while (g[i].length != ctrl.w)
                if (g[i].length < ctrl.w) g[i].push([]);
                else g[i].pop();
            // Z
            for (let j = 0; j < g[i].length; j++)
                while (g[i][j].length != ctrl.d)
                    if (g[i][j].length < ctrl.d) g[i][j].push(0);
                    else g[i][j].pop();
            }
              
        // Dimensions
        gridSize.d = ctrl.d;
        gridSize.h = ctrl.h;
        gridSize.w = ctrl.w;
                
        // Camera
        easycam.setDistance(p.max([ctrl.w, ctrl.h, ctrl.d]) * tileSize * 2);

        return g;
    }

    p.drawGrid = function() {
        p.stroke(p.color(0));
        p.translate(-0.5 * grid[0].length * tileSize, -0.5 * grid.length * tileSize, -0.5 * grid[0][0].length * tileSize);
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++)  {
                for (let k = 0; k < grid[i][j].length; k++) {
                    if (grid[i][j][k]) p.fill(p.color(0));
                    else p.noFill();
                    p.translate(0, 0, tileSize);
                    p.box(tileSize);
                }
                p.translate(tileSize, 0, -tileSize * grid[i][j].length);
            }
            p.translate(-tileSize * grid[i].length, tileSize, 0);
        }
    }

    /******************************************************** Camera*********************************************************/

    p.enableCamera = function(b) {
        let scl, lbl;
        if (b) {
            scl = 0.0005;
            lbl = "Brush";
        }
        else {
            scl = 0;
            lbl = "Camera";
        }
        easycam.setRotationScale(scl);
        easycam.setZoomScale(scl);
        //btnBrush.name(lbl);
    }

    /******************************************************** States *******************************************************/

    p.brushCamera = function() {
        state = (state + 1) % 2;
        switch (state) {
            case CAMERA:
                p.enableCamera(true);
                break;
            case BRUSH:
                p.enableCamera(false);
                break;
            default:
                return;
        }
    }

    p.pauseResume = function() {
        paused = !paused;
        if (paused) p.noLoop();
        else        p.loop();
        btnPause.name((paused) ? "Resume" : "Pause");
    }

    p.reset = function() { grid = p.initGrid(gridSize, ctrl.population); 
        // Debugging purposes, delete afterwards
        grid[5][5][1] = 1;
        grid[5][5][2] = 1;
        grid[5][6][1] = 1;
        grid[5][6][2] = 1; 
        p.drawGrid();
    }

    /********************************************************* GUI *********************************************************/

    p.initGUI = function() {

        // Controls
        Controls = function() {
            this.w           = gridSize.w;
            this.h           = gridSize.h;
            this.d           = gridSize.d;
            this.nghbrRadius = 1;
            this.ruleSet     = p.ruleSetString();
            this.deathThresh = 2;
            this.neutral     = 2;
            this.lifeThresh  = 3;
            this.brushCamera = function() { p.brushCamera(); }
            this.population  = 0.3;
            this.fps         = 1/*30*/;
            this.pauseResume = function() { p.pauseResume(); }
            this.reset       = function() { p.reset(); };
        };
        ctrl = new Controls();

        gui  = new dat.GUI();
        // Grid dimensions Sliders
        gui.add(ctrl, "w", 1, 50, 1)
           .name("Grid width")
           .onChange(function(value) {
                ctrl.w = value;
                grid   = p.resizeGrid(grid, ctrl);
            });
        gui.add(ctrl, "h", 1, 50, 1)
           .name("Grid height")
           .onChange(function(value) {
                ctrl.h = value;
                grid   = p.resizeGrid(grid, ctrl);
            });
        gui.add(ctrl, "d", 1, 50, 1)
           .name("Grid depth")
           .onChange(function(value) {
                ctrl.d = value;
                grid   = p.resizeGrid(grid, ctrl);
            });

        // Rules
        gui.add(ctrl, "nghbrRadius", 1, 5, 1)
           .name("Neighbourhood")
           .onChange(function(value) { neighbourhoodRadius = value; });
        gui.add(ctrl, "ruleSet")
           .name("Rules Set")
           .onChange(function(value) { p.updateRuleSet(value) });

        // Simulation control
        //btnBrush = gui.add(ctrl, "brushCamera").name("Brush");
        gui.add(ctrl, "fps", 1, 60).name("Max FpS");
        btnPause = gui.add(ctrl, "pauseResume").name("Pause");
        gui.add(ctrl, "population", 0, 1).name("Population Ratio");
        gui.add(ctrl, "reset").name("Populate");

    }

    /******************************************************** Misc *********************************************************/

    p.modulus = function(a,b) { return (a + b) % b; }

}