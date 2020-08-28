"use strict";

const vertexShaderText = `
precision mediump float;

attribute vec3 vertPosition;
// attribute float lowerUnit;
attribute float upperUnit;

varying vec4 fragColor;
varying vec3 loc;

uniform float tilt;
uniform vec2 pointA;
uniform vec2 pointB;
uniform float depthOffset;

void main()
{
  vec3 c1 = vec3(183.0,231.0,255.0)/255.0;
  vec3 c2 = vec3(109.0,199.0,255.0)/255.0;
  vec3 c3 = vec3(205.0,255.0,160.0)/255.0;
  vec3 c4 = vec3(136.0,245.0,129.0)/255.0;
  vec3 c5 = vec3(255.0,164.0,163.0)/255.0;
  vec3 c6 = vec3(255.0,72.0,74.0)/255.0;
  vec3 c7 = vec3(255.0,219.0,130.0)/255.0;
  vec3 c8 = vec3(255.0,168.0,47.0)/255.0;

  if (upperUnit == 0.0) {
    fragColor = vec4(c1, 1.0);
  } else if (upperUnit == 1.0) {
    fragColor = vec4(c2, 1.0);
  } else if (upperUnit == 2.0) {
    fragColor = vec4(c3, 1.0);
  } else if (upperUnit == 3.0) {
    fragColor = vec4(c4, 1.0);
  } else if (upperUnit == 4.0) {
    fragColor = vec4(c5, 1.0);
  } else if (upperUnit == 5.0) {
    fragColor = vec4(c6, 1.0);
  } else if (upperUnit == 6.0) {
    fragColor = vec4(c7, 1.0);
  } else if (upperUnit == 7.0) {
    fragColor = vec4(c8, 1.0);
  } else {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }

  vec2 B1 = vec2(pointB.x-pointA.x, pointB.y-pointA.y);
  vec2 p = vec2(vertPosition.x-pointA.x, vertPosition.y-pointA.y);

  float Btheta = atan(B1.y,B1.x);
  float C = cos(-Btheta);
  float S = sin(-Btheta);
  vec2 X = vec2(C*p.x-S*p.y, S*p.x+C*p.y);

  float AB = sqrt(B1.x*B1.x + B1.y*B1.y);
  float pitchAdjusted = (2.0*vertPosition.z-1.0 + X.y/depthOffset*sin(tilt));
  gl_Position = vec4((X.x/AB)*2.0-1.0, pitchAdjusted, X.y, 1.0);
  gl_PointSize = 3.0;

  loc = vec3(gl_Position.x,gl_Position.y,gl_Position.z/depthOffset);
}`;

const fragmentShaderText = `
precision mediump float;

varying vec4 fragColor;
varying vec3 loc;

void main()
{
  if (loc.z*loc.z > 1.0 || loc.x*loc.x > 1.0 || loc.y*loc.y > 1.0) {
    discard;
  } else {
    gl_FragColor = fragColor;
  }
}`;

const data = {
  vertices: null,
  elementSize: 20
};

const state = {
  depthOffset: new Float32Array([0.05]),
  tilt: new Float32Array([0.0]),
  pointA: new Float32Array([0.82,0.4]),
  pointB: new Float32Array([0.86,0.52]),
  dragging: '',
  dragstartptr: [0,0],
  dragstartpoints: [0,0],
  mapbounds: [[-122,45], [-110,49]]
};

const tools = {
  add: function(a,b) { return a.map((v,i) => v+b[i]); },
  distance: function(a,b) {
    return Math.sqrt(Math.pow(b[0]-a[0],2)+Math.pow(b[1]-a[1],2));
  },
  rotatePoint: function(pt, axis, dtheta) {
    const R = tools.distance(pt,axis);
    const theta0 = Math.atan2(pt[1]-axis[1],pt[0]-axis[0]);
    const theta1 = theta0+dtheta*Math.PI/180;
    return tools.add(axis,[R*Math.cos(theta1),R*Math.sin(theta1)]);
  },
  project: function(a,b,x) {
    const B = [b[0]-a[0], b[1]-a[1]];
    const X = [x[0]-a[0], x[1]-a[1]];
    const Btheta = Math.atan2(B[1], B[0]);
    const C=Math.cos(-Btheta), S=Math.sin(-Btheta);
    return [C*X[0]-S*X[1], S*X[0]+C*X[1]];
  },
  unproject: function(a,b,x) {
    let B = [b[0]-a[0], b[1]-a[1]];
    let Btheta = Math.atan2(B[1],B[0]);
    let C=Math.cos(Btheta), S=Math.sin(Btheta);
    return [C*x[0]-S*x[1], S*x[0]+C*x[1]];
  },
  xy2canvas: function(pt, width, height) {
    // Input values in range (0,1)
    // Outputs values in Canvas space (upside down, and scaled to width & height)
    return [width*pt[0], height*(1.0-pt[1])];
  },
  map2xy: function(lonlat) {
    const mapwidth = state.mapbounds[1][0]-state.mapbounds[0][0];
    const mapheight = state.mapbounds[1][1]-state.mapbounds[0][1];
    const x = (lonlat[0]-state.mapbounds[0][0])/mapwidth;
    const y = (lonlat[1]-state.mapbounds[0][1])/mapheight;
    return [x,y];
  },
  xy2map: function(xy) {
    const mapwidth = state.mapbounds[1][0]-state.mapbounds[0][0];
    const mapheight = state.mapbounds[1][1]-state.mapbounds[0][1];
    const lon = xy[0]*mapwidth + state.mapbounds[0][0];
    const lat = xy[1]*mapheight + state.mapbounds[0][1];
    return [lon,lat];
  }
};

const startDrag = (e) => {
  e.preventDefault();
  const rect = document.getElementById("map-overlay").getBoundingClientRect();
  const pos = [(e.clientX - rect.left)/rect.width,
            1-(e.clientY - rect.top)/rect.height];
  const AX = tools.distance(pos,state.pointA);
  const BX = tools.distance(pos,state.pointB);
  if (e.buttons === 1 && (AX < 0.05 || BX < 0.05)) {
    state.dragging = (AX < BX) ? "A" : "B";
  } else if (Math.abs(tools.project(state.pointA, state.pointB, pos)[1]) < 0.05) {
    state.dragging = "AB";
  } else {
    state.dragging = "";
  }
  if (state.dragging !== "") {
    state.dragstartpoints = [[state.pointA[0],state.pointA[1]],
                             [state.pointB[0],state.pointB[1]]];
    state.dragstartptr = pos;
  }
};

const stopDrag = ((e) => state.dragging = "");

const loadData = async function() {
  return fetch('./points.json').then(r => r.json()).then(d=>{
    const points = d.points;
    const buffer = new ArrayBuffer(data.elementSize*points.length/5);
    const dv = new DataView(buffer);
    // 4 bytes per floating point, 1 byte per uint8
    // = 14 bytes total
    for (let i=0; i<points.length/5; i++) {
      dv.setFloat32(data.elementSize*i, points[5*i], true);
      dv.setFloat32(data.elementSize*i+4, points[5*i+1], true);
      dv.setFloat32(data.elementSize*i+8, points[5*i+2], true);
      dv.setFloat32(data.elementSize*i+12, points[5*i+3], true);
      dv.setFloat32(data.elementSize*i+16, points[5*i+4], true);
    }
    return buffer;
  });
}

const updateMapOverlay = function() {
  const mapCanvas = document.getElementById("map-overlay");
  const ctx = mapCanvas.getContext("2d");
  const W=mapCanvas.width, H=mapCanvas.height;
  //ctx.globalCompositeOperation = 'destination-over';
  ctx.clearRect(0, 0, W, H); // clear canvas

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
  ctx.moveTo(...tools.xy2canvas(state.pointA,W,H));
  ctx.lineTo(...tools.xy2canvas(state.pointB,W,H));
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  const plus_box = tools.unproject(state.pointA,state.pointB,[0,state.depthOffset]);
  const minus_box = tools.unproject(state.pointA,state.pointB,[0,-state.depthOffset]);
  ctx.moveTo(...tools.xy2canvas(tools.add(state.pointA,minus_box),W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.pointA,plus_box), W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.pointB,plus_box), W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.pointB,minus_box),W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.pointA,minus_box),W,H));
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.font = "25px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const Atxtoffset = tools.unproject(state.pointA,state.pointB,[-0.03,0]);
  const Btxtoffset = tools.unproject(state.pointA,state.pointB,[ 0.03,0]);
  ctx.fillText("A", ...tools.xy2canvas(tools.add(state.pointA,Atxtoffset),W,H));
  ctx.fillText("B", ...tools.xy2canvas(tools.add(state.pointB,Btxtoffset),W,H));
  ctx.stroke();
}

const setupBackgroundMap = async function() {
  document.getElementById("map-div").oncontextmenu = (e) => startDrag(e);
  updateMapOverlay();

  const cmap = [[166,206,227],
                [31,120,180],
                [178,223,138],
                [51,160,44],
                [251,154,153],
                [227,26,28],
                [253,191,111],
                [255,127,0]];

  const mapCanvas = document.getElementById("map-background");
  const ctx = mapCanvas.getContext("2d");
  const W=mapCanvas.width, H=mapCanvas.height;
  //ctx.globalCompositeOperation = 'destination-over';
  ctx.clearRect(0, 0, W, H); // clear canvas
  ctx.beginPath();
  const dv = new DataView(data.vertices);
  for (let i=0; i<data.vertices.byteLength/data.elementSize; i++) {
    if (i%5==0) {
      const lon = dv.getFloat32(data.elementSize*i+0,true);
      const lat = dv.getFloat32(data.elementSize*i+4,true);
      //const lowerUnit = dv.getFloat32(data.elementSize*i+12,true);
      const upperUnit = dv.getFloat32(data.elementSize*i+16,true);
      const color = cmap[Math.round(upperUnit)];
      //ctx.strokeStyle = `rgba(${255*upperUnit/7.0}, ${255*upperUnit/7.0}, 255, 1.0)`;
      ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1.0)`;
      ctx.closePath();
      ctx.beginPath();
      ctx.arc(...tools.xy2canvas([lon,lat],W,H), 2, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}

const handleKeyDown = function(e) {
  let move;
  switch (e.code) {
    case 'KeyA':
      state.depthOffset[0] *= (e.key === 'A') ? 1.02 : 0.98;
      state.depthOffset[0] = Math.max(state.depthOffset[0],0.005);
      break;
    case 'ArrowLeft':
      if (e.altKey) {
        move = tools.unproject(state.pointA, state.pointB, [-tools.distance(state.pointA, state.pointB)*0.01, 0.0]);
        state.pointA[0] += move[0]; state.pointA[1] += move[1];
        state.pointB[0] += move[0]; state.pointB[1] += move[1];
      } else {
        let axis = [(state.pointA[0]+state.pointB[0])/2, (state.pointA[1]+state.pointB[1])/2];
        const A1 = tools.rotatePoint(state.pointA, axis, 3.0);
        const B1 = tools.rotatePoint(state.pointB, axis, 3.0);
        state.pointA[0] = A1[0]; state.pointA[1] = A1[1];
        state.pointB[0] = B1[0]; state.pointB[1] = B1[1];
      }
      break;
    case 'ArrowRight':
      if (e.altKey) {
        move = tools.unproject(state.pointA, state.pointB, [tools.distance(state.pointA, state.pointB)*0.01, 0.0]);
        state.pointA[0] += move[0]; state.pointA[1] += move[1];
        state.pointB[0] += move[0]; state.pointB[1] += move[1];
      } else {
        let axis = [(state.pointA[0]+state.pointB[0])/2, (state.pointA[1]+state.pointB[1])/2];
        const A1 = tools.rotatePoint(state.pointA, axis, -3.0);
        const B1 = tools.rotatePoint(state.pointB, axis, -3.0);
        state.pointA[0] = A1[0]; state.pointA[1] = A1[1];
        state.pointB[0] = B1[0]; state.pointB[1] = B1[1];
      }
      break;
    case 'ArrowUp':
      if (e.ctrlKey) {
        state.tilt[0] += 1*Math.PI/180;
        state.tilt[0] = Math.min(state.tilt[0], Math.PI/2);
      } else {
        move = tools.unproject(state.pointA, state.pointB, [0.0, tools.distance(state.pointA, state.pointB)*0.01]);
        state.pointA[0] += move[0]; state.pointA[1] += move[1];
        state.pointB[0] += move[0]; state.pointB[1] += move[1];
      }
      break;
    case 'ArrowDown':
      if (e.ctrlKey) {
        state.tilt[0] -= 1*Math.PI/180;
        state.tilt[0] = Math.max(0.0,state.tilt[0]);
      } else {
        move = tools.unproject(state.pointA, state.pointB, [0.0, -tools.distance(state.pointA, state.pointB)*0.01]);
        state.pointA[0] += move[0]; state.pointA[1] += move[1];
        state.pointB[0] += move[0]; state.pointB[1] += move[1];
      }
      break;
  }
};

const InitApp = async function() {
  console.log("This is working");
  const dataPromise = loadData();
  updateMapOverlay();

  const glCanvas = document.getElementById("xsection");
  const gl = glCanvas.getContext("webgl") || glCanvas.getContext("experimental-webgl");

  if (!gl) {
    alert('Your browser does not support WebGL');
    return;
  }

  //gl.clearColor(0.75,0.85,0.8,1.0);
  //gl.clearColor(0.75,0.75,0.75,1.0);
  gl.clearColor(0.0,0.0,0.0,0.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.enable(gl.CULL_FACE);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.blendEquation(gl.FUNC_ADD);

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader, vertexShaderText);
  gl.shaderSource(fragmentShader, fragmentShaderText);

  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('ERROR compiling vertex shader!',
                  gl.getShaderInfoLog(vertexShader));
    return;
  }
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('ERROR compiling fragment shader!',
                  gl.getShaderInfoLog(fragmentShader));
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('ERROR linking program!', gl.getProgramInfoLog(program));
    return;
  }

  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error('ERROR validating program!', gl.getProgramInfoLog(program));
    return;
  }

  //
  // Create buffers
  //
  let triangleVertexBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
  data.vertices = await dataPromise;
  //console.log(dv.getFloat32(0,true), dv.getFloat32(4,true), dv.getUint8(12), dv.getUint8(13));
  setupBackgroundMap();
  gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);

  const positionAttribLocation = gl.getAttribLocation(program,'vertPosition');
  gl.vertexAttribPointer(positionAttribLocation, // locations
    3, // number of elements per attribute
    gl.FLOAT, // type of elements
    gl.FALSE, // normalization.
    data.elementSize, // size of an individual attribute (see loadData comment above)
    0 // Offset from beginning of a single vertex to this attribute
  );
  gl.enableVertexAttribArray(positionAttribLocation);

  // const unit1AttribLocation = gl.getAttribLocation(program,'lowerUnit');
  // gl.vertexAttribPointer(unit1AttribLocation, 1, gl.FLOAT, gl.FALSE, data.elementSize, 12);
  // gl.enableVertexAttribArray(unit1AttribLocation);

  const unit2AttribLocation = gl.getAttribLocation(program,'upperUnit');
  gl.vertexAttribPointer(unit2AttribLocation, 1, gl.FLOAT, gl.FALSE, data.elementSize, 16);
  gl.enableVertexAttribArray(unit2AttribLocation);

  gl.useProgram(program);

  let tiltUniformLocation = gl.getUniformLocation(program, 'tilt');
  let pointAUniformLocation = gl.getUniformLocation(program, 'pointA');
  let pointBUniformLocation = gl.getUniformLocation(program, 'pointB');
  let depthOffsetUniformLocation = gl.getUniformLocation(program, 'depthOffset');
  gl.uniform1f(tiltUniformLocation, state.tilt[0]);
  gl.uniform2fv(pointAUniformLocation, state.pointA);
  gl.uniform2fv(pointBUniformLocation, state.pointB);
  gl.uniform1f(depthOffsetUniformLocation, state.depthOffset[0]);

  const AlabelSpan = document.getElementById('Alabel');
  const BlabelSpan = document.getElementById('Blabel');
  const AspectLabelSpan = document.getElementById('AspectLabel');
  const PitchLabelSpan = document.getElementById('PitchLabel');

  let s, c, degreesPerSecond=45, currentAngle=0;
  const loop = async function (currentTime) {
    gl.uniform1f(tiltUniformLocation, state.tilt[0]);
    gl.uniform2fv(pointAUniformLocation, state.pointA);
    gl.uniform2fv(pointBUniformLocation, state.pointB);
    gl.uniform1f(depthOffsetUniformLocation, state.depthOffset[0]);

    AlabelSpan.textContent = `A: (${state.pointA[0].toFixed(2)}, ${state.pointA[1].toFixed(2)})`;
    BlabelSpan.textContent = `B: (${state.pointB[0].toFixed(2)}, ${state.pointB[1].toFixed(2)})`;
    AspectLabelSpan.textContent = `Thickness: ${(111.0*state.depthOffset[0]*2).toFixed(2)}`;
    PitchLabelSpan.innerHTML = `Pitch: ${(state.tilt[0]*180/Math.PI).toFixed(2)} &#176;`;

    //gl.clearColor(0.0,0.0,0.0,0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0/*offset*/, data.vertices.byteLength/data.elementSize/*vertex count*/);
  };

  document.body.addEventListener('mousedown', (e) => startDrag(e));
  document.body.addEventListener('mouseup', (e) => stopDrag(e));
  document.body.addEventListener('mousemove', (e) => {
    if (e.buttons > 0) {
      const rect = document.getElementById("map-overlay").getBoundingClientRect();
      const pos = [(e.clientX - rect.left)/rect.width,
                1-(e.clientY - rect.top)/rect.height];
      if (pos[0] > 0.0 && pos[0] < 1.0 && pos[1] > 0.0 && pos[1] < 1.0) {
        const dx = [pos[0]-state.dragstartptr[0], pos[1]-state.dragstartptr[1]];
        if (e.buttons === 1) { // left click drag
          if (state.dragging === 'A') {
            state.pointA[0] = state.dragstartpoints[0][0] + dx[0];
            state.pointA[1] = state.dragstartpoints[0][1] + dx[1];
          } else if (state.dragging === 'B') {
            state.pointB[0] = state.dragstartpoints[1][0] + dx[0];
            state.pointB[1] = state.dragstartpoints[1][1] + dx[1];
          }
        } else if (e.buttons === 2 && state.dragging === 'AB') { // right click drag
          state.pointA[0] = state.dragstartpoints[0][0] + dx[0];
          state.pointA[1] = state.dragstartpoints[0][1] + dx[1];
          state.pointB[0] = state.dragstartpoints[1][0] + dx[0];
          state.pointB[1] = state.dragstartpoints[1][1] + dx[1];
        }
        window.requestAnimationFrame(updateMapOverlay);
        window.requestAnimationFrame(loop);
      }
    }
  });

  document.body.addEventListener('keydown', (e) => {
    if (e.ctrlKey === false) {
      e.preventDefault();
    }
    handleKeyDown(e);
    window.requestAnimationFrame(updateMapOverlay);
    window.requestAnimationFrame(loop);
  });

  window.requestAnimationFrame(loop);
};
