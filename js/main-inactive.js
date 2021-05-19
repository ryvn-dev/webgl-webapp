
    // global variables...
    var gl;
    var shaderProgram;

    var mvMatrix = mat4.create();
    var pMatrix  = mat4.create();
    var nvMatrix  = mat4.create();

    // light related variables 
    var lightPosition = vec3.create();
    var lightColor = vec3.create();

    // var modelName = ["Teapot","Teapot","Teapot"];

    var teapotVertexPositionBuffer = [null, null, null];
    var teapotVertexNormalBuffer = [null, null, null];
    var teapotVertexFrontColorBuffer = [null, null, null];
    var teapotVertexTextureCoordBuffer = [null, null, null];

    var ObjXMin = [null, null, null];
    var ObjYMin = [null, null, null];
    var ObjZMin = [null, null, null];
    var ObjXMax = [null, null, null];
    var ObjYMax = [null, null, null];
    var ObjZMax = [null, null, null];
    var scaleOffset = [1.0, 1.0, 1.0];
    var turnOn = [true, false, false];

    var transDirection = [0.0,0.0,0.0];
    var MoveDir = [1,1,1];
    var rotateAngle = 180;
    var lastTime    = 0;

    function initGL(canvas) {
        try {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            gl.viewportWidth  = canvas.width;
            gl.viewportHeight = canvas.height;
        } 
        catch (e) {
        }

        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
        gl.getExtension('OES_standard_derivatives');
    }

    function handleLoadedTexture(texture, image) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	}
	
    var textureSet = [null, null, null, null, null];
    function initTextures(filename, idx) {
        var newText = gl.createTexture();
        var image = new Image();
        image.crossOrigin = '';
        
        image.src = filename;
        image.onload = function() {
            handleLoadedTexture(newText, image);
        }
        
        textureSet[idx] = newText;
    }

    function getShader(gl, shaderScript, type) {
        if (!shaderScript) {
            return null;
        }
        
        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (type == "fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } 
        else if (type == "vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } 
        else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    var programCadidates = [null, null, null, null];
    function buildAllShaders() {
        flatfragmentShader = getShader(gl, document.getElementById("flatf"), "fragment");
        flatvertexShader   = getShader(gl, document.getElementById("flatv"), "vertex");

        programCadidates[0] = gl.createProgram();
        gl.attachShader(programCadidates[0], flatvertexShader);
        gl.attachShader(programCadidates[0], flatfragmentShader);
        gl.linkProgram(programCadidates[0]);

        if (!gl.getProgramParameter(programCadidates[0], gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gouraudfragmentShader = getShader(gl, document.getElementById("gouraudf"), "fragment");
        gouraudvertexShader   = getShader(gl, document.getElementById("gouraudv"), "vertex");

        programCadidates[1] = gl.createProgram();
        gl.attachShader(programCadidates[1], gouraudvertexShader);
        gl.attachShader(programCadidates[1], gouraudfragmentShader);
        gl.linkProgram(programCadidates[1]);

        if (!gl.getProgramParameter(programCadidates[1], gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }     

        phongfragmentShader = getShader(gl, document.getElementById("phongf"), "fragment");
        phongvertexShader   = getShader(gl, document.getElementById("phongv"), "vertex");

        programCadidates[2] = gl.createProgram();
        gl.attachShader(programCadidates[2], phongvertexShader);
        gl.attachShader(programCadidates[2], phongfragmentShader);
        gl.linkProgram(programCadidates[2]);

        if (!gl.getProgramParameter(programCadidates[2], gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }
        
        celfragmentShader = getShader(gl, document.getElementById("celf"), "fragment");
        celvertexShader   = getShader(gl, document.getElementById("celv"), "vertex");

        programCadidates[3] = gl.createProgram();
        gl.attachShader(programCadidates[3], celvertexShader);
        gl.attachShader(programCadidates[3], celfragmentShader);
        gl.linkProgram(programCadidates[3]);

        if (!gl.getProgramParameter(programCadidates[3], gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }   
    }

    function initShaders(shader_type, modelidx) {
        
        shaderProgram = programCadidates[shader_type];
        gl.useProgram(shaderProgram);

        // Model
        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
        
        shaderProgram.vertexFrontColorAttribute = gl.getAttribLocation(shaderProgram, "aFrontColor");
        gl.enableVertexAttribArray(shaderProgram.vertexFrontColorAttribute);
        
        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
        
        // texture
        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        if (modelName[modelidx] === "Teapot"){
            gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
        } else {
            gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
        }

        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        shaderProgram.textureEnableUniform = gl.getUniformLocation(shaderProgram, "uTexture");

        // Uniform
        shaderProgram.pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
        
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        
        shaderProgram.nvMatrixUniform = gl.getUniformLocation(shaderProgram, "uNVMatrix");

        // Light
        shaderProgram.lightPositionUniform = gl.getUniformLocation(shaderProgram, "uLightPosition");
        
        shaderProgram.lightColorUniform = gl.getUniformLocation(shaderProgram, "uLightColor");
        
        shaderProgram.lightEnableUniform = gl.getUniformLocation(shaderProgram, "uLightTurnOn");
        
        shaderProgram.lightKaUniform = gl.getUniformLocation(shaderProgram, "uLightKa");
        
        shaderProgram.lightKdUniform = gl.getUniformLocation(shaderProgram, "uLightKd");
        
        shaderProgram.lightKsUniform = gl.getUniformLocation(shaderProgram, "uLightKs");
    
        shaderProgram.lightShineUniform = gl.getUniformLocation(shaderProgram, "uLightShine");
        
        


    }


    function setUniforms() {
        var lightPositions = [];
        var lightColors = [];
        var lightShine = [];
        var ka = [];
        var kd = [];
        var ks = [];
        for (var i=1; i<4; i++) {
            lightPositions.push(parseFloat(document.getElementById("light" + i + "-x").value));
            lightPositions.push(parseFloat(document.getElementById("light" + i + "-y").value));
            lightPositions.push(parseFloat(document.getElementById("light" + i + "-z").value));
            let picked_color = document.getElementById("light" + i + "-color").value;
            const r = parseInt(picked_color.substr(1,2), 16) / 255.0;
            const g = parseInt(picked_color.substr(3,2), 16) / 255.0;
            const b = parseInt(picked_color.substr(5,2), 16) / 255.0;
            lightColors.push(r); lightColors.push(g); lightColors.push(b);
            lightShine.push(10-parseFloat(document.getElementById("light" + i + "-shine").value)*2);
            ka.push(parseFloat(document.getElementById("light" + i + "-ka").value)/100);
            kd.push(parseFloat(document.getElementById("light" + i + "-kd").value)/100);
            ks.push(parseFloat(document.getElementById("light" + i + "-ks").value)/100);
            // lightEnabledArray.push(Boolean(document.getElementById('lightPoint-' + i + '-enable').checked) ? 1.0 : 0.0);
        }

        gl.uniform3fv(shaderProgram.lightPositionUniform, lightPositions);
        gl.uniform3fv(shaderProgram.lightColorUniform, lightColors);
        gl.uniform1fv(shaderProgram.lightEnableUniform, turnOn);
        gl.uniform1fv(shaderProgram.lightShineUniform, lightShine);
        gl.uniform1fv(shaderProgram.lightKaUniform, ka);
        gl.uniform1fv(shaderProgram.lightKdUniform, kd);
        gl.uniform1fv(shaderProgram.lightKsUniform, ks);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.uniformMatrix4fv(shaderProgram.nvMatrixUniform, false, nvMatrix);
    }

    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    function handleLoadedTeapot(teapotData, index) {
        teapotVertexPositionBuffer[index] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer[index]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexPositions), gl.STATIC_DRAW);
        teapotVertexPositionBuffer[index].itemSize = 3;
        teapotVertexPositionBuffer[index].numItems = teapotData.vertexPositions.length / 3;

        // normalizing
        ObjXMin[index] = ObjXMax[index] = teapotData.vertexPositions[0];
        ObjYMin[index] = ObjYMax[index] = teapotData.vertexPositions[1];
        ObjZMin[index] = ObjZMax[index] = teapotData.vertexPositions[2];

        for(var i=3; i<teapotData.vertexPositions.length; i+=3) {
            ObjXMin[index] = (ObjXMin[index] > teapotData.vertexPositions[i])? teapotData.vertexPositions[i]:ObjXMin[index];
            ObjYMin[index] = (ObjYMin[index] > teapotData.vertexPositions[i+1])? teapotData.vertexPositions[i+1]:ObjYMin[index];
            ObjZMin[index] = (ObjZMin[index] > teapotData.vertexPositions[i+2])? teapotData.vertexPositions[i+2]:ObjZMin[index];

            ObjXMax[index] = (ObjXMax[index] < teapotData.vertexPositions[i])? teapotData.vertexPositions[i]:ObjXMax[index];
            ObjYMax[index] = (ObjYMax[index] < teapotData.vertexPositions[i+1])? teapotData.vertexPositions[i+1]:ObjYMax[index];
            ObjZMax[index] = (ObjZMax[index] < teapotData.vertexPositions[i+2])? teapotData.vertexPositions[i+2]:ObjZMax[index];
        }

        var disX = ObjXMax[index]-ObjXMin[index];
        var disY = ObjYMax[index]-ObjYMin[index];
        var disZ = ObjZMax[index]-ObjZMin[index];

        if(disX >= disY) {
            if (disX >= disZ) {
                scaleOffset[index] = 16.0 / disX;
            } else {
                scaleOffset[index] = 16.0 / disZ;
            }
        }
        else {
            if (disY >= disZ) {
                scaleOffset[index] = 16.0 / disY;
            } else {
                scaleOffset[index] = 16.0 / disZ;
            }
        }


        teapotVertexNormalBuffer[index] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer[index]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexNormals), gl.STATIC_DRAW);
        teapotVertexNormalBuffer[index].itemSize = 3;
        teapotVertexNormalBuffer[index].numItems = teapotData.vertexNormals.length / 3;

        teapotVertexFrontColorBuffer[index] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexFrontColorBuffer[index]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexFrontcolors), gl.STATIC_DRAW);
        teapotVertexFrontColorBuffer[index].itemSize = 3;
        teapotVertexFrontColorBuffer[index].numItems = teapotData.vertexFrontcolors.length / 3;
        
        if (modelName[index] === "Teapot"){
            teapotVertexTextureCoordBuffer[index] = gl.createBuffer();
		    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer[index]);
		    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexTextureCoords), gl.STATIC_DRAW);
		    teapotVertexTextureCoordBuffer[index].itemSize = 2;
		    teapotVertexTextureCoordBuffer[index].numItems = teapotData.vertexTextureCoords.length / 2;
        } 
        else {
            
        }
    }

    function loadTeapot(name) {
        
        var request0 = new XMLHttpRequest();
        request0.open("GET", "./model/" + name[0] + ".json");
        request0.onreadystatechange = function () {
            if (request0.readyState == 4) {
                handleLoadedTeapot(JSON.parse(request0.responseText), 0);
            }
        }
        request0.send();

        var request1 = new XMLHttpRequest();
        request1.open("GET", "./model/" + name[1] + ".json");
        request1.onreadystatechange = function () {
            if (request1.readyState == 4) {
                handleLoadedTeapot(JSON.parse(request1.responseText), 1);
            }
        }
        request1.send();

        var request2 = new XMLHttpRequest();
        request2.open("GET", "./model/" + name[2] + ".json");
        request2.onreadystatechange = function () {
            if (request2.readyState == 4) {
                handleLoadedTeapot(JSON.parse(request2.responseText), 2);
            }
        }
        request2.send();
        
    }

    /*
        TODO HERE:
        add two or more objects showing on the canvas
        (it needs at least three objects showing at the same time)
    */
    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // check 3 model has 3 properties 
        for (let i = 0; i < 3; i++) {
            if (teapotVertexPositionBuffer[i]   == null || 
                teapotVertexNormalBuffer[i]     == null || 
                teapotVertexFrontColorBuffer[i] == null) {
            return;
            }            
        }
        
        var place = [-18,0,18];

        for (let modelidx = 0; modelidx < 3; modelidx++) {
            
            initShaders(shader_type[modelidx], modelidx);
        
            // Setup Projection Matrix
            mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

            // Set transformation options from html
            //// Translate
            var translate_axis = transDirection;

            //// Rotate
            var rotate_axis = [0,0,0];
            rotate_axis[0] = document.getElementById("rxin").value/100;
            rotate_axis[1] = document.getElementById("ryin").value/100;
            rotate_axis[2] = document.getElementById("rzin").value/100;
            
            
            //// Scale
            var scaleValueDom = document.getElementById("scale-value");
            var scaleValue = parseFloat(scaleValueDom.value) / 100.0;

            var center = [-(ObjXMax[modelidx]+ObjXMin[modelidx])/2.0, -(ObjYMax[modelidx]+ObjYMin[modelidx])/2.0, -(ObjZMax[modelidx]+ObjZMin[modelidx])/2.0];


            //// Shear
            var shear = mat4.create();
            mat4.identity(shear);
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    if (j == 3 || i == 3){
                        continue;
                    }
                    var row = i+1;
                    var col = j+1;
                    shear[4*i+j] = document.getElementById("m"+String(row)+String(col)).value;
                }
            }

            // Setup Model-View Matrix
            mat4.identity(mvMatrix);
            mat4.translate(mvMatrix, translate_axis);
            mat4.translate(mvMatrix, [place[modelidx], 0, -40]);
            mat4.rotate(mvMatrix, degToRad(rotateAngle), rotate_axis);
            mat4.multiply(mvMatrix, shear);
            mat4.scale(mvMatrix, [scaleOffset[modelidx] * scaleValue, scaleOffset[modelidx] * scaleValue, scaleOffset[modelidx] * scaleValue]);
            mat4.translate(mvMatrix, center);

            mat4.inverse(mvMatrix, nvMatrix);
            mat4.transpose(nvMatrix, nvMatrix);

            setUniforms();
            
            // setup texture only for teapot
            var texture_ele = ["texture0", "texture1", "texture2"];
            var texture_type = document.getElementById(texture_ele[modelidx]).value;
            gl.uniform1i(shaderProgram.textureEnableUniform, 0);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            if (modelName[modelidx] === "Teapot"){
                if (texture_type != 0){
                    gl.uniform1i(shaderProgram.textureEnableUniform, 1);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, textureSet[texture_type-1]);
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer[modelidx]);
                gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
                                        teapotVertexTextureCoordBuffer[modelidx].itemSize, 
                                        gl.FLOAT, 
                                        false, 
                                        0, 
                                        0);
            }

            // Setup teapot position data
            gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer[modelidx]);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                                teapotVertexPositionBuffer[modelidx].itemSize, 
                                gl.FLOAT, 
                                false, 
                                0, 
                                0);

            // Setup teapot front color data
            gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexFrontColorBuffer[modelidx]);
            gl.vertexAttribPointer(shaderProgram.vertexFrontColorAttribute, 
                                teapotVertexFrontColorBuffer[modelidx].itemSize, 
                                gl.FLOAT, 
                                false, 
                                0, 
                                0);

            // Setup teapot normal
            gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer[modelidx]);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                                teapotVertexNormalBuffer[modelidx].itemSize, 
                                gl.FLOAT, 
                                false, 
                                0, 
                                0);
            
            var drawmode = ["drawmode0", "drawmode1", "drawmode2"] 
            gl.drawArrays(document.getElementById(drawmode[modelidx]).value, 
                        0, 
                        teapotVertexPositionBuffer[modelidx].numItems);
        }
    }

    var elapsedCoefficient = 0.01
    function elapseCalculation(speedvalue){
        
        var spinner = document.getElementById("speedspinner");
        if(speedvalue == 0){
            elapsedCoefficient = 0;
            spinner.style.disabled = true;
        } else {
            elapsedCoefficient = Math.pow(10, speedvalue/500 - 3);
            spinner.style.animationDuration = String(100000/speedvalue)+"ms";
        }
    }

    function animate(rotate_enable, translate_enable) {
        var timeNow = new Date().getTime();
        if (lastTime != 0) {
            var elapsed = timeNow - lastTime;
            if(rotate_enable)
                rotateAngle += 3 * elapsedCoefficient * elapsed;
            if(translate_enable) {
                for (let i = 0; i < 3; i++){
                    var threshold = document.getElementById("tin"+[i]).value/100 * 6;
                    if (threshold == 0){
                        transDirection[i] = 0;
                    } else {
                        transDirection[i] += MoveDir[i] * elapsedCoefficient * elapsed * 0.1 * threshold;
                        MoveDir[i] = (transDirection[i] > threshold) ? -1 : (transDirection[i] < -threshold ? 1:MoveDir[i]);
                    }
                }
            }
        }
        
        lastTime = timeNow;
    }

    function tick() {
        requestAnimFrame(tick);
        drawScene();

        animate(true, true);
    }

    var shader_type = [0,1,2] 
    function setShader(type, index){
        shader_type[index] = type;
        console.log(shader_type);
        webGLStart();
    }

    var modelName = ["Teapot","Teapot","Teapot"];
    function setModel(name, index) {
        modelName[index] = String(name);
        // console.log(modelName);
        webGLStart();
    }

    function notTeatopTextureSelect(modelid, textureid){
        var form = document.getElementById(textureid);
        if(document.getElementById(modelid).value != "Teapot"){
            form.disabled = true;
            form.value = 0;
        } else {
            form.disabled = false;
        }
    }

    function webGLStart() {
        var canvas = document.getElementById("ICG-canvas");
        //canvas.width = window.innerWidth;
        initGL(canvas);
        //initShaders(shader_type);
        if (programCadidates[0] === null || 
        programCadidates[1] === null || 
        programCadidates[2] === null ||
        programCadidates[3] === null){
            buildAllShaders();
        }

        if (textureSet[0] === null ||
            textureSet[1] === null ||
            textureSet[2] === null ||
            textureSet[3] === null ||
            textureSet[4] === null){
            initTextures("./textures/LV.png", 0);
			initTextures("./textures/BR.jpg", 1);
			initTextures("./textures/BV.jpg", 2);
            initTextures("./textures/gucci.jpg", 3);
            initTextures("./textures/hermes.png", 4);
        }

        loadTeapot(modelName);

        notTeatopTextureSelect("model0", "texture0");
        notTeatopTextureSelect("model1", "texture1");
        notTeatopTextureSelect("model2", "texture2");

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        tick();
    }

    function turnOnLight(index){
        var object = document.getElementById("lightbulb"+String(index));
        // console.log(object.style.color)
        if (object.style.color === "rgb(0, 0, 0)"){
            object.style.color = "rgb(243, 210, 155)";
            turnOn[index] = true;
        } else {
            object.style.color = "rgb(0, 0, 0)";
            turnOn[index] = false;
        }
    }

    function randomshear(){
        for (let i = 1; i <= 3 ; i++) {
            for (let j = 1; j <= 3; j++) {
                var temp = Math.round(Math.random() * 100) / 100;
                if (Math.random() >= 0.5){
                    temp = -temp
                }
                if (i == j){
                    temp = 1;
                }
                document.getElementById("m"+String(i)+String(j)).value = temp;
            }
        }
    }
