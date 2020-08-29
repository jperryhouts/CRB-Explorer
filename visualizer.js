"use strict";

const unitNames = ['OLDER','IMNAHA','PICTURE GORGE','CRB','GRR1','GRN1','GRR2','GRN2','YOUNGER'];

/* https://colorbrewer2.org/#type=qualitative&scheme=Paired&n=8 */
const colorPallet = [
  [0,0,0],
  [183.0,231.0,255.0],
  [109.0,199.0,255.0],
  [205.0,255.0,160.0],
  [136.0,245.0,129.0],
  [255.0,164.0,163.0],
  [255.0,72.0,74.0],
  [255.0,219.0,130.0],
  [255.0,168.0,47.0]];

const c2str = (c) => `${c[0]},${c[1]},${c[2]}`;
const normc2str = (c) => `${c[0]/255},${c[1]/255},${c[2]/255}`;

const vertexShaderText = `
precision mediump float;

attribute vec3 vtxPosition;
attribute float isUpperUnit;
attribute float unitIndex;

varying vec4 fragColor;
varying float isVisible;

uniform float canvasAspect;
uniform vec2 pointA;
uniform vec2 pointB;
uniform float sectionHalfThickness;
uniform float tilt;
uniform vec2 scroll;
uniform float zoom;

void main()
{
  vec2 B1 = vec2(pointB.x-pointA.x, pointB.y-pointA.y);
  vec2 p = vec2(vtxPosition.x-pointA.x, vtxPosition.y-pointA.y);

  // Move to AB-axis perspective
  float Btheta = atan(B1.y,B1.x);
  float C = cos(-Btheta);
  float S = sin(-Btheta);
  vec3 X = vec3(C*p.x-S*p.y, (vtxPosition.z-0.5), S*p.x+C*p.y);

  if (X.z*X.z > sectionHalfThickness*sectionHalfThickness) {
    isVisible = 0.0;
  } else {
    isVisible = 1.0;

    // Upper unit should be smaller and in front of lower unit point.
    float pointOffset = 0.0;
    if (isUpperUnit > 0.5) {
      gl_PointSize = 7.0;
    } else {
      gl_PointSize = 3.0;
      pointOffset = -0.001;
    }

    // Scale & shift lateral dimensions
    float AB = sqrt(B1.x*B1.x + B1.y*B1.y);
    X = vec3(X.x/AB-0.5, X.y, X.z/AB*canvasAspect);

    // Do tilt (pitch) transform
    C = cos(-tilt); S = sin(-tilt);
    X = vec3(X.x, (C*X.y-S*X.z), (S*X.y+C*X.z));

    // Zoom
    X = X * vec3(1.0, zoom, zoom);

    // Vertical scroll
    X += vec3(scroll.x, scroll.y, 0.0);

    gl_Position = vec4(2.0*X.x, 2.0*X.y, 2.0*X.z+pointOffset, 1.0);

    float alpha = 1.0;
    if (unitIndex == 0.0) {
      fragColor = vec4(${normc2str(colorPallet[0])}, alpha);
    } else if (unitIndex == 1.0) {
      fragColor = vec4(${normc2str(colorPallet[1])}, alpha);
    } else if (unitIndex == 2.0) {
      fragColor = vec4(${normc2str(colorPallet[2])}, alpha);
    } else if (unitIndex == 3.0) {
      fragColor = vec4(${normc2str(colorPallet[3])}, alpha);
    } else if (unitIndex == 4.0) {
      fragColor = vec4(${normc2str(colorPallet[4])}, alpha);
    } else if (unitIndex == 5.0) {
      fragColor = vec4(${normc2str(colorPallet[5])}, alpha);
    } else if (unitIndex == 6.0) {
      fragColor = vec4(${normc2str(colorPallet[6])}, alpha);
    } else if (unitIndex == 7.0) {
      fragColor = vec4(${normc2str(colorPallet[7])}, alpha);
    }else if (unitIndex == 8.0) {
      fragColor = vec4(${normc2str(colorPallet[8])}, alpha);
    } else {
      fragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  }
}`;

const fragmentShaderText = `
precision mediump float;

varying vec4 fragColor;
varying float isVisible;

void main()
{
  if (isVisible > 0.5) {
    gl_FragColor = fragColor;
  } else {
    discard;
  }
}`;

const data = {
  vertices: null,
  elementSize: 20,
  limits: [[null,null,null],[null,null,null]],
};

const state = {
  sectionHalfThickness: new Float32Array([0.012]),
  tilt: new Float32Array([0.0]),
  // pointA: new Float32Array([0.82,0.4]),
  // pointB: new Float32Array([0.86,0.52]),
  pointA: new Float32Array([0.828,0.506]),
  pointB: new Float32Array([0.919,0.432]),
  dragging: '',
  dragstartptr: [[0,0],[0,0]],
  dragstartpoints: [[0,0],[0,0]],
  dragstartscroll: [0.0,0.0],
  dragstartruler: [[0,0],[0,0]],
  mapbounds: [[-124.5,43.5],[-115.5,48.5]], // must be the same as data.limits for now.
  zoom: new Float32Array([1.0]), // cross section zoom
  scroll: new Float32Array([0.0,0.0]), // manually moved cross section plot.
  ruler: [[0.98,0.25],[0.98,0.75]],
};

const tools = {
  add: function(a,b) { return a.map((v,i) => v+b[i]); },
  sub: function(a,b) { return a.map((v,i) => v-b[i]); },
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
  doTranslate: function(dx) {
    const move = tools.unproject(state.pointA, state.pointB, dx);
    state.pointA[0] += move[0]; state.pointA[1] += move[1];
    state.pointB[0] += move[0]; state.pointB[1] += move[1];
  },
  doRotate: function(dTheta) {
    const axis = [(state.pointA[0]+state.pointB[0])/2,
                  (state.pointA[1]+state.pointB[1])/2];
    const A1 = tools.rotatePoint(state.pointA, axis, dTheta);
    const B1 = tools.rotatePoint(state.pointB, axis, dTheta);
    state.pointA[0] = A1[0]; state.pointA[1] = A1[1];
    state.pointB[0] = B1[0]; state.pointB[1] = B1[1];
  },
  doTilt: function(dPhi) {
    state.tilt[0] += dPhi*Math.PI/180;
    state.tilt[0] = Math.min(state.tilt[0], Math.PI/2);
    state.tilt[0] = Math.max(state.tilt[0], 0.0);
  },
  xy2canvas: function(pt, width, height) {
    // Input values in range (0,1)
    // Outputs values in Canvas space (upside down, and scaled to width & height)
    return [width*pt[0], height*(1.0-pt[1])];
  },
  lonlat2xy: function(lonlat) {
    const mapwidth = data.limits[1][0]-data.limits[0][0];
    const mapheight = data.limits[1][1]-data.limits[0][1];
    const x = (lonlat[0]-data.limits[0][0])/mapwidth;
    const y = (lonlat[1]-data.limits[0][1])/mapheight;
    return [x,y];
  },
  xy2lonlat: function(xy) {
    const mapwidth = data.limits[1][0]-data.limits[0][0];
    const mapheight = data.limits[1][1]-data.limits[0][1];
    const lon = xy[0]*mapwidth + data.limits[0][0];
    const lat = xy[1]*mapheight + data.limits[0][1];
    return [lon,lat];
  }
};

const startDrag = (e) => {
  e.preventDefault();
  const rect1 = document.getElementById("map-overlay").getBoundingClientRect();
  const pos1 = [(e.clientX - rect1.left)/rect1.width,
            1-(e.clientY - rect1.top)/rect1.height];
  const rect2 = document.getElementById("xsection").getBoundingClientRect();
  const pos2 = [(e.clientX - rect2.left)/rect2.width,
              1-(e.clientY - rect2.top)/rect2.height];
  const AX = tools.distance(pos1,state.pointA);
  const BX = tools.distance(pos1,state.pointB);
  if (e.buttons === 1 && (AX < 0.05 || BX < 0.05)) {
    state.dragging = (AX < BX) ? "A" : "B";
  } else if (Math.abs(tools.project(state.pointA, state.pointB, pos1)[1]) < 0.05) {
    state.dragging = "AB";
  } else if (pos2[0]>0 && pos2[0]<1 && pos2[0]>0 && pos2[1]<1) {
    if (e.buttons === 1) {
      const R1 = tools.distance(pos2,state.ruler[0]);
      const R2 = tools.distance(pos2,state.ruler[1]);
      if (R1 < 0.05 || R2 < 0.05) {
        state.dragging = (R1 < R2) ? 'ruler_1' : 'ruler_2';
      }
    } else if (e.buttons === 2) {
      const R = Math.abs(tools.project(state.ruler[0], state.ruler[1], pos2)[1]);
      if (R < 0.05) {
        state.dragging = 'ruler_12';
      }
    } else if (e.buttons === 4) {
      state.dragging = "scroll";
    }
  } else {
    state.dragging = "";
  }
  if (state.dragging !== "") {
    state.dragstartpoints = [[state.pointA[0],state.pointA[1]],
                             [state.pointB[0],state.pointB[1]]];
    state.dragstartptr = [pos1, pos2];
    state.dragstartruler = [[state.ruler[0][0],state.ruler[0][1]],
                            [state.ruler[1][0],state.ruler[1][1]]];
    state.dragstartscroll = [state.scroll[0],state.scroll[1]];
  }
};

const stopDrag = ((e) => state.dragging = "");

const loadData = async function() {
  const buffer = await fetch('./points.bin').then(resp => resp.arrayBuffer());
  const dv = new DataView(buffer);
  const endpos = buffer.byteLength-24;
  const lim0 = [dv.getFloat32(endpos,true), dv.getFloat32(endpos+4,true), dv.getFloat32(endpos+8,true)];
  const lim1 = [dv.getFloat32(endpos+12,true), dv.getFloat32(endpos+16,true), dv.getFloat32(endpos+20,true)];
  data.limits = [new Float32Array(lim0), new Float32Array(lim1)];
  data.vertices = buffer.slice(0,endpos);
}

const updateXsectionOverlay = function() {
  const overlayCanvas = document.getElementById("xsection-overlay");
  const ctx = overlayCanvas.getContext("2d");
  const W=overlayCanvas.width, H=overlayCanvas.height;

  // Draw ruler line
  ctx.clearRect(0, 0, W, H); // clear canvas
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.moveTo(...tools.xy2canvas(state.ruler[0],W,H));
  ctx.lineTo(...tools.xy2canvas(state.ruler[1],W,H));
  ctx.closePath();
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Draw ticks at ends of ruler line
  const aspect = W/H;
  const theta = Math.atan2((state.ruler[1][1]-state.ruler[0][1]),
                             (state.ruler[1][0]-state.ruler[0][0])*aspect)+Math.PI/2;
  const ortho1 = [0.01*Math.cos(theta),0.01*Math.sin(theta)*aspect];
  const ortho2 = [-0.01*Math.cos(theta),-0.01*Math.sin(theta)*aspect];
  ctx.beginPath();
  ctx.moveTo(...tools.xy2canvas(state.ruler[0],W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.ruler[0],ortho1), W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.ruler[0],ortho2), W,H));
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(...tools.xy2canvas(state.ruler[1],W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.ruler[1],ortho1), W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.ruler[1],ortho2), W,H));
  ctx.closePath();
  ctx.stroke();

  // Calculate ruler length
  const limits = tools.sub(data.limits[1],data.limits[0]);
  const AB = tools.distance(state.pointA,state.pointB);
  const rulerX = Math.abs(state.ruler[1][0] - state.ruler[0][0])*(limits[0])*AB*111.1e3;
  const rulerY = Math.abs(state.ruler[1][1] - state.ruler[0][1])*(limits[2])/state.zoom;
  const RulerLabelSpan = document.getElementById('RulerLabel');
  RulerLabelSpan.textContent = `${(Math.sqrt(rulerX*rulerX + rulerY*rulerY)/1e3).toFixed(2)}`;
};

const updateMapOverlay = function() {
  const mapCanvas = document.getElementById("map-overlay");
  const ctx = mapCanvas.getContext("2d");
  const W=mapCanvas.width, H=mapCanvas.height;
  //ctx.globalCompositeOperation = 'destination-over';
  ctx.clearRect(0, 0, W, H); // clear canvas

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.moveTo(...tools.xy2canvas(state.pointA,W,H));
  ctx.lineTo(...tools.xy2canvas(state.pointB,W,H));
  ctx.closePath();
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  const plus_box = tools.unproject(state.pointA,state.pointB,[0,state.sectionHalfThickness]);
  const minus_box = tools.unproject(state.pointA,state.pointB,[0,-state.sectionHalfThickness]);
  const midpoint = tools.add(state.pointA,state.pointB);
  midpoint[0] /= 2; midpoint[1] /= 2;
  ctx.moveTo(...tools.xy2canvas(tools.add(midpoint,minus_box),W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.pointA,minus_box),W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.pointA,plus_box), W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.pointB,plus_box), W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.pointB,minus_box),W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(midpoint,minus_box),W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.pointA,plus_box),W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(state.pointB,plus_box),W,H));
  ctx.lineTo(...tools.xy2canvas(tools.add(midpoint,minus_box),W,H));
  ctx.closePath();
  ctx.lineWidth = 1;
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

const setupLegend = function() {
  const swatches = document.getElementById('swatches');
  for (let i=colorPallet.length-1; i>-1; i--) {
    const e = document.createElement('div');
    const f = document.createElement('div');
    f.style.width = "15px";
    f.style.height = "15px";
    f.style.backgroundColor = `rgb(${c2str(colorPallet[i])})`;
    f.style.display = 'inline-block';
    const g = document.createElement('span');
    g.textContent = unitNames[i];
    g.style.paddingLeft = '1em';
    e.appendChild(f);
    e.appendChild(g);
    swatches.appendChild(e);
  }
};

const setupBackgroundMap = function() {
  const mapCanvasDiv = document.getElementById("map-background");
  const W=mapCanvasDiv.clientWidth, H=mapCanvasDiv.clientHeight;

  const layers = [];
  for (let i=0; i<colorPallet.length; i++) {
    const layer = document.createElement('canvas');
    layer.setAttribute('width',`${W}px`);
    layer.setAttribute('height',`${H}px`);
    mapCanvasDiv.appendChild(layer);
    const ctx = layer.getContext("2d");
    ctx.clearRect(0,0,W,H);
    layers.push(ctx);
  }

  const placeDot = async function(x,y,isUpperUnit,unitIndex) {
    const ctx = layers[unitIndex];
    const color = colorPallet[unitIndex];
    const dotRadius = (isUpperUnit) ? 2.0 : 1.0;
    ctx.strokeStyle = `rgba(${c2str(color)}, 1.0)`;
    ctx.beginPath();
    ctx.arc(...tools.xy2canvas([x,y],W,H), dotRadius, 0.0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
  };

  // Do this with lots of async function calls to minimize perceived speed.
  const dv = new DataView(data.vertices);
  for (let i=0; i<data.vertices.byteLength/data.elementSize; i+=5) {
    const x = dv.getFloat32(data.elementSize*i+0,true);
    const y = dv.getFloat32(data.elementSize*i+4,true);
    const isUpperUnit = (dv.getFloat32(data.elementSize*i+12,true) > 0.5);
    const unitIndex = Math.round(dv.getFloat32(data.elementSize*i+16,true));
    placeDot(x,y,isUpperUnit,unitIndex);
  }
}

const InitApp = async function() {
  console.log("This is working");

  setupLegend();
  setupBackgroundMap();
  updateMapOverlay();
  updateXsectionOverlay();

  const glCanvas = document.getElementById("xsection");
  const gl = glCanvas.getContext("webgl") || glCanvas.getContext("experimental-webgl");

  if (!gl) {
    alert('Your browser does not support WebGL');
    return;
  }

  //gl.clearColor(0.75,0.85,0.8,1.0);
  //gl.clearColor(0.75,0.75,0.75,1.0);
  gl.clearColor(0.7,0.7,0.7,1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);
  // gl.enable(gl.BLEND);
  gl.enable(gl.CULL_FACE);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  // gl.blendEquation(gl.FUNC_ADD);

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
  gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);

  const positionAttribLocation = gl.getAttribLocation(program,'vtxPosition');
  gl.vertexAttribPointer(positionAttribLocation, // locations
    3, // number of elements per attribute
    gl.FLOAT, // type of elements
    gl.FALSE, // normalization.
    data.elementSize, // size of an individual attribute (see loadData comment above)
    0 // Offset from beginning of a single vertex to this attribute
  );
  gl.enableVertexAttribArray(positionAttribLocation);

  const unit1AttribLocation = gl.getAttribLocation(program,'isUpperUnit');
  gl.vertexAttribPointer(unit1AttribLocation, 1, gl.FLOAT, gl.FALSE, data.elementSize, 12);
  gl.enableVertexAttribArray(unit1AttribLocation);

  const unit2AttribLocation = gl.getAttribLocation(program,'unitIndex');
  gl.vertexAttribPointer(unit2AttribLocation, 1, gl.FLOAT, gl.FALSE, data.elementSize, 16);
  gl.enableVertexAttribArray(unit2AttribLocation);

  // const icon = document.getElementById('icon');
  // const glTexture = gl.createTexture(gl.TEXTURE0);
  // gl.bindTexture(gl.TEXTURE_2D, glTexture);
  // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, icon);
  // gl.generateMipmap(gl.TEXTURE_2D);

  gl.useProgram(program);

  let tiltUniformLocation = gl.getUniformLocation(program, 'tilt');
  let pointAUniformLocation = gl.getUniformLocation(program, 'pointA');
  let pointBUniformLocation = gl.getUniformLocation(program, 'pointB');
  let sectionHalfThicknessUniformLocation = gl.getUniformLocation(program, 'sectionHalfThickness');
  let canvasAspectUniformLocation = gl.getUniformLocation(program, 'canvasAspect');
  let zoomUniformLocation = gl.getUniformLocation(program, 'zoom');
  let scrollUniformLocation = gl.getUniformLocation(program, 'scroll');
  gl.uniform1f(tiltUniformLocation, state.tilt[0]);
  gl.uniform2fv(pointAUniformLocation, state.pointA);
  gl.uniform2fv(pointBUniformLocation, state.pointB);
  gl.uniform1f(sectionHalfThicknessUniformLocation, state.sectionHalfThickness[0]);
  gl.uniform1f(canvasAspectUniformLocation, (new Float32Array([glCanvas.width/glCanvas.height]))[0]);
  gl.uniform1f(zoomUniformLocation, state.zoom[0]);
  gl.uniform2fv(scrollUniformLocation, state.scroll);

  const AlabelSpan = document.getElementById('Alabel');
  const BlabelSpan = document.getElementById('Blabel');
  const AspectLabelSpan = document.getElementById('AspectLabel');
  const PitchLabelSpan = document.getElementById('PitchLabel');


  let s, c, degreesPerSecond=45, currentAngle=0;
  const loop = async function (currentTime) {
    gl.uniform1f(tiltUniformLocation, state.tilt[0]);
    gl.uniform2fv(pointAUniformLocation, state.pointA);
    gl.uniform2fv(pointBUniformLocation, state.pointB);
    gl.uniform1f(sectionHalfThicknessUniformLocation, state.sectionHalfThickness[0]);
    gl.uniform1f(zoomUniformLocation, state.zoom[0]);
    gl.uniform2fv(scrollUniformLocation, state.scroll);

    const lonlatA = tools.xy2lonlat(state.pointA);
    const lonlatB = tools.xy2lonlat(state.pointB);
    AlabelSpan.textContent = `(${lonlatA[0].toFixed(2)}, ${lonlatA[1].toFixed(2)})`;
    BlabelSpan.textContent = `(${lonlatB[0].toFixed(2)}, ${lonlatB[1].toFixed(2)})`;
    AspectLabelSpan.textContent = `${(111.0*state.sectionHalfThickness[0]*2).toFixed(2)}`;
    PitchLabelSpan.textContent = `${(state.tilt[0]*180/Math.PI).toFixed(2)}`;

    updateXsectionOverlay();

    //gl.clearColor(0.0,0.0,0.0,0.0);
    gl.clearColor(0.7,0.7,0.7,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0/*offset*/, data.vertices.byteLength/data.elementSize/*vertex count*/);
  };

  document.body.addEventListener('wheel', (e) => {
    const rect = document.getElementById("xsection").getBoundingClientRect();
    const pos = [(e.clientX - rect.left)/rect.width,
               1-(e.clientY - rect.top)/rect.height];
    if (pos[0] > 0.0 && pos[0] < 1.0 && pos[1] > 0.0 && pos[1] < 1.0) {
      e.preventDefault();
      state.zoom[0] -= e.deltaY*0.05;
      state.zoom[0] = Math.min(Math.max(0.1, state.zoom[0]),4.0);
      window.requestAnimationFrame(loop);
    }
  });
  document.body.addEventListener('mousedown', (e) => startDrag(e));
  document.body.addEventListener('mouseup', (e) => stopDrag(e));
  document.body.addEventListener('mousemove', (e) => {
    if (e.buttons > 0) {
      if (['scroll','ruler_1','ruler_2','ruler_12'].includes(state.dragging)) {
        const rect = document.getElementById("xsection").getBoundingClientRect();
        const pos = [(e.clientX - rect.left)/rect.width,
                   1-(e.clientY - rect.top)/rect.height];

        if (pos[0] > 0.0 && pos[0] < 1.0 && pos[1] > 0.0 && pos[1] < 1.0) {
          const dx = [pos[0]-state.dragstartptr[1][0], pos[1]-state.dragstartptr[1][1]];
          if (e.buttons === 4) {
            if (state.dragging === 'scroll') {
              //state.scroll[0] = state.dragstartscroll[0] + dx[0];
              state.scroll[1] = state.dragstartscroll[1] + dx[1];
              window.requestAnimationFrame(loop);
            }
          } else if (e.buttons === 2) {
            if (state.dragging === 'ruler_12') {
              state.ruler[0] = tools.add(state.dragstartruler[0],dx);
              state.ruler[1] = tools.add(state.dragstartruler[1],dx);
              window.requestAnimationFrame(updateXsectionOverlay);
            }
          } else if (e.buttons === 1) {
            if (state.dragging === 'ruler_1') {
              state.ruler[0] = tools.add(state.dragstartruler[0],dx);
            } else if (state.dragging === 'ruler_2') {
              state.ruler[1] = tools.add(state.dragstartruler[1],dx);
            }
            window.requestAnimationFrame(updateXsectionOverlay);
          }
        }
        //window.requestAnimationFrame(updateMapOverlay);
      } else if (state.dragging === 'A' || state.dragging === 'B' || state.dragging === 'AB') {
        const  rect = document.getElementById("map-overlay").getBoundingClientRect();
        const  pos = [(e.clientX - rect.left)/rect.width,
                    1-(e.clientY - rect.top)/rect.height];
        if (pos[0] > 0.0 && pos[0] < 1.0 && pos[1] > 0.0 && pos[1] < 1.0) {
          const dx = [pos[0]-state.dragstartptr[0][0], pos[1]-state.dragstartptr[0][1]];
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
    }
  });

  const handleKeyDown = function(e) {
    switch (e.code) {
      case 'KeyZ':
        // Grow/shrink in small increments for narrow cross sections.
        const dZ = ((e.key === 'Z') ? 1.0 : -1.0) * 0.1 * Math.log(state.sectionHalfThickness[0]+1.0-0.004);
        state.sectionHalfThickness[0] = Math.max(state.sectionHalfThickness[0]+dZ,0.005);
        break;
      case 'Space':
        state.zoom[0] = 1.0;
        state.scroll[0] = 0.0;
        state.scroll[1] = 0.0;
        state.tilt[0] = 0.0;
        break
      case 'ArrowLeft':
        if (e.shiftKey)
          tools.doTranslate([-tools.distance(state.pointA, state.pointB)*0.01, 0.0]);
        else
          tools.doRotate(3.0);
        break;
      case 'ArrowRight':
        if (e.shiftKey)
          tools.doTranslate([tools.distance(state.pointA, state.pointB)*0.01, 0.0]);
        else
          tools.doRotate(-3.0);
        break;
      case 'ArrowUp':
        if (e.shiftKey)
          tools.doTilt(4.0);
        else
          tools.doTranslate([0.0, tools.distance(state.pointA, state.pointB)*0.01]);
        break;
      case 'ArrowDown':
        if (e.shiftKey)
          tools.doTilt(-4.0);
        else
          tools.doTranslate([0.0, -tools.distance(state.pointA, state.pointB)*0.01]);
        break;
    }
  };

  document.body.addEventListener('keydown', (e) => {
    e.preventDefault();
    handleKeyDown(e);
    window.requestAnimationFrame(updateXsectionOverlay);
    window.requestAnimationFrame(updateMapOverlay);
    window.requestAnimationFrame(loop);
  });

  document.getElementById("map-div").oncontextmenu = (e) => startDrag(e);
  document.getElementById("xsection").oncontextmenu = (e) => startDrag(e);
  document.getElementById("xsection-div").oncontextmenu = (e) => startDrag(e);
  document.getElementById("xsection-overlay").oncontextmenu = (e) => startDrag(e);

  window.requestAnimationFrame(loop);
};

window.addEventListener('load',() => {
  console.log("Loading data...");
  loadData().then(InitApp, console.error);
});
