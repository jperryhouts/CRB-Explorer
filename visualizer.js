"use strict";

const unitNames = ['OLDER','IMNAHA','PICTURE GORGE',
    'CRB','GRR1','GRN1','GRR2','GRN2',
    'WANAPUM','LWR. WANAPUM','UPR. WANAPUM',
    'WEISER',
    'SADDLE MTN', 'LWR. SADDLE MTN','UPR. SADDLE MTN',
    'POWDER RIVER', 'SEDIMENT'];

/* https://colorbrewer2.org/#type=qualitative&scheme=Paired&n=8 */
const colorPallet = [
  [0,0,0], // Older
    [182,137,230], // Imnaha
    [226,198,241], // PG

  // [110,177,211], // CRB (undifferentiated)
  // [109.0,199.0,255.0], // GRR1
  // [183.0,231.0,255.0], // GRN1
  // [205.0,255.0,160.0], // GRR2
  // [136.0,245.0,129.0], // GRN2
  [1,70,54],[1,108,89],[2,129,138],[54,144,192],[103,169,207],

  // // Picture Gorge
  // [65,171,93],

  [255.0,72.0,74.0], // Wanapum
  [255.0,99.0,100.0], // Wanapum lower
  [255.0,140.0,120.0], // Wanapum upper

  // Weiser
  //[221,52,151],
  [254,224,210],

  [255.0,168.0,47.0], // Saddle mtn
  [255.0,199.0,83.0], // Saddle mtn lower
  [255,255,180], // Saddle mtn upper

  // // Ellensburg Latah interbeds
  // [102,37,6],

  // Powder River
  [150,150,150],

  // Sediments + Younger
  [255,255,255]

  // [255.0,219.0,130.0] // younger
  //  [255,237,130] // YOUNGER
  // [217,240,163], // Powder river
  // [173,221,142], // picture gorge
  // [120,198,121], // Weiser
  // [247,252,185], // Interbeds
  // [255,237,130] // Sediments
];

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
      gl_PointSize = 6.0;
    } else {
      gl_PointSize = 2.0;
      pointOffset = 2e-9; // Mediump float precision
    }

    // Scale & shift lateral dimensions
    float AB = sqrt(B1.x*B1.x + B1.y*B1.y);
    X = vec3(X.x/AB-0.5, X.y*max(zoom,0.01), X.z/AB*canvasAspect);

    // Do tilt (pitch) transform
    C = cos(-tilt); S = sin(-tilt);
    X = vec3(X.x, (C*X.y-S*X.z), (S*X.y+C*X.z));

    // Scale scene depth
    X *= vec3(1.0, 1.0, AB/canvasAspect/sectionHalfThickness/2.0);
    // Just to be safe, let's squish things down even more in depth.
    // This prevents clipping deep strata when they are tilted around x-axis
    X /= vec3(1.0, 1.0, 10.0);

    // Vertical scroll
    X += vec3(scroll.x, scroll.y, 0.0);

    gl_Position = vec4(2.0*X.x, 2.0*X.y, X.z-pointOffset, 1.0);

    if (unitIndex == 0.0) {
      fragColor = vec4(${normc2str(colorPallet[0])}, 1.0);
    } else if (unitIndex == 1.0) {
      fragColor = vec4(${normc2str(colorPallet[1])}, 1.0);
    } else if (unitIndex == 2.0) {
      fragColor = vec4(${normc2str(colorPallet[2])}, 1.0);
    } else if (unitIndex == 3.0) {
      fragColor = vec4(${normc2str(colorPallet[3])}, 1.0);
    } else if (unitIndex == 4.0) {
      fragColor = vec4(${normc2str(colorPallet[4])}, 1.0);
    } else if (unitIndex == 5.0) {
      fragColor = vec4(${normc2str(colorPallet[5])}, 1.0);
    } else if (unitIndex == 6.0) {
      fragColor = vec4(${normc2str(colorPallet[6])}, 1.0);
    } else if (unitIndex == 7.0) {
      fragColor = vec4(${normc2str(colorPallet[7])}, 1.0);
    }else if (unitIndex == 8.0) {
      fragColor = vec4(${normc2str(colorPallet[8])}, 1.0);
    }else if (unitIndex == 9.0) {
      fragColor = vec4(${normc2str(colorPallet[9])}, 1.0);
    }else if (unitIndex == 10.0) {
      fragColor = vec4(${normc2str(colorPallet[10])}, 1.0);
    }else if (unitIndex == 11.0) {
      fragColor = vec4(${normc2str(colorPallet[11])}, 1.0);
    }else if (unitIndex == 12.0) {
      fragColor = vec4(${normc2str(colorPallet[12])}, 1.0);
    }else if (unitIndex == 13.0) {
      fragColor = vec4(${normc2str(colorPallet[13])}, 1.0);
    }else if (unitIndex == 14.0) {
      fragColor = vec4(${normc2str(colorPallet[14])}, 1.0);
    }else if (unitIndex == 15.0) {
      fragColor = vec4(${normc2str(colorPallet[15])}, 1.0);
    }else if (unitIndex == 16.0) {
      fragColor = vec4(${normc2str(colorPallet[16])}, 1.0);
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
  if (isVisible > 0.5 && fragColor[3] > 0.0) {
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
  tilt: new Float32Array([0.0]),
  sectionHalfThickness: new Float32Array([0.012]),
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
  dot: function(a,b) { return a[0]*b[0] + a[1]*b[1] + (a[2]|0)*(b[2]|0); },
  distance: function(a,b) {
    return Math.sqrt(Math.pow(b[0]-a[0],2)+Math.pow(b[1]-a[1],2));
  },
  mapDistanceDegrees: function(x,y) {
    const lonx = x[0]*Math.PI/180, latx = x[1]*Math.PI/180;
    const lony = y[0]*Math.PI/180, laty = y[1]*Math.PI/180;
    const a = Math.acos(Math.sin(latx)*Math.sin(laty) +
                        Math.cos(latx)*Math.cos(laty)*Math.cos(lony-lonx));
    return a*180/Math.PI;
  },
  mapDistanceMeters: function(x,y) {
    return 6378e3*tools.mapDistanceDegrees(x,y)*Math.PI/180;
  },
  lonlat2xyz: function(lonlat) {
    const r = 6378e3, theta = lonlat[0]*Math.PI/180, phi = lonlat[1]*Math.PI/180;
    const x = r*Math.cos(theta)*Math.cos(phi);
    const y = r*Math.sin(theta)*Math.cos(phi);
    const z = r*Math.sin(phi);
    return [x,y,z];
  },
  xyz2lonlat: function(x,y,z) {
    const r = Math.sqrt(x*x+y*y+z*z);
    const phi = Math.asin(z/r);
    const theta = Math.atan(y/x);
    return [theta*180/Math.PI, phi*180/Math.PI];
  },
  rotatePoint: function(pt, axis, dtheta) {
    const R = tools.distance(pt,axis);
    const theta0 = Math.atan2(pt[1]-axis[1],pt[0]-axis[0]);
    const theta1 = theta0+dtheta*Math.PI/180;
    return tools.add(axis,[R*Math.cos(theta1),R*Math.sin(theta1)]);
  },
  mapRotatePoint: function(x, axis, dTheta) {
    // Not implemented
    throw 'Not implemented';
  },
  mapMidpoint: function(x,y) {
    const lonx = x[0]*Math.PI/180, latx = x[1]*Math.PI/180;
    const lony = y[0]*Math.PI/180, laty = y[1]*Math.PI/180;

    const A = lony-lonx, b = Math.PI/2-latx, c = Math.PI/2-laty;
    const a = Math.acos(Math.cos(b)*Math.cos(c) + Math.sin(b)*Math.sin(c)*Math.cos(A));
    const C = Math.asin(Math.sin(c)*Math.sin(A)/Math.sin(a));

    const a1 = a/2;
    const c1 = Math.acos(Math.cos(b)*Math.cos(a1) + Math.sin(b)*Math.sin(a1)*Math.cos(C));

    const a1lon = lonx+A/2, a1lat = Math.PI/2-c1;
    return [a1lon*180/Math.PI, a1lat*180/Math.PI];
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
  doAbsoluteTranslate: function(posA, posB, dx) {
    const move = tools.unproject(posA, posB, dx);
    state.pointA[0] = posA[0] + move[0]; state.pointA[1] = posA[1] + move[1];
    state.pointB[0] = posB[0] + move[0]; state.pointB[1] = posB[1] + move[1];
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
  },
  getRulerProperties(position, tilt, zoom) {
    const info = {};
    if (tilt === 0.0) {
      info.decoration = "none";
      info.title = "";
    } else {
      info.decoration = "line-through";
      info.title = "Ruler element does not have a well defined meaning when the view angle is tilted.";
    }
    if (position !== null) {
      const rulerX = position[0], rulerY = position[1];
      if (zoom === 0) {
        info.text = String.fromCharCode(8734); // Infinity
      } else {
        info.text = (Math.sqrt(rulerX*rulerX + rulerY*rulerY)/1e3).toFixed(2);
      }
    }
    return info;
  }
};

const startDrag = (e) => {
  const rect1 = document.getElementById("map-overlay").getBoundingClientRect();
  const pos1 = [(e.clientX - rect1.left)/rect1.width,
            1-(e.clientY - rect1.top)/rect1.height];
  const rect2 = document.getElementById("xsection").getBoundingClientRect();
  const pos2 = [(e.clientX - rect2.left)/rect2.width,
              1-(e.clientY - rect2.top)/rect2.height];
  const AX = tools.distance(pos1,state.pointA);
  const BX = tools.distance(pos1,state.pointB);

  if (e.buttons === 1 && (AX < 0.05 || BX < 0.05)) {
    e.preventDefault();
    state.dragging = (AX < BX) ? "A" : "B";
  } else if (Math.abs(tools.project(state.pointA, state.pointB, pos1)[1]) < 0.05) {
    e.preventDefault();
    state.dragging = "AB";
  } else if (pos2[0]>0 && pos2[0]<1 && pos2[1]>0 && pos2[1]<1) {
    e.preventDefault();
    if (e.buttons === 1) {
      const R1 = tools.distance(pos2,state.ruler[0]);
      const R2 = tools.distance(pos2,state.ruler[1]);
      if (R1 < 0.05 || R2 < 0.05) {
        state.dragging = (R1 < R2) ? 'ruler_1' : 'ruler_2';
      } else {
        state.dragging = "tiltpan";
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
  const W=overlayCanvas.clientWidth, H=overlayCanvas.clientHeight;
  if (W !== overlayCanvas.width ||
      H !== overlayCanvas.height) {
      overlayCanvas.width = W;
      overlayCanvas.height = H;
    }

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
  const extent = tools.sub(data.limits[1],data.limits[0]);
  const AB = tools.mapDistanceMeters(state.pointA,state.pointB);
  const rulerX = Math.abs(state.ruler[1][0] - state.ruler[0][0])*(extent[0])*AB;
  const rulerY = Math.abs(state.ruler[1][1] - state.ruler[0][1])*(extent[2])/state.zoom;
  const RulerLabelSpan = document.getElementById('RulerLabel');
  const RulerInfoSpan = document.getElementById('ruler-info');
  const rulerInfo = tools.getRulerProperties([rulerX, rulerY], state.tilt[0], state.zoom[0]);
  RulerLabelSpan.textContent = rulerInfo.text;
  RulerInfoSpan.style.textDecoration = rulerInfo.decoration;
  RulerInfoSpan.title = rulerInfo.title;
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
    f.style.outline = '1px solid black';
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

  const placeDot = function(x,y,isUpperUnit,unitIndex) {
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
    if (unitIndex < colorPallet.length) {
      placeDot(x,y,isUpperUnit,unitIndex);
    }
  }
}

const InitApp = async function() {
  console.log("This is working");

  setupBackgroundMap();
  updateMapOverlay();
  updateXsectionOverlay();

  const glCanvas = document.getElementById("xsection");
  glCanvas.width = glCanvas.clientWidth;
  glCanvas.height = glCanvas.clientHeight;
  const gl = glCanvas.getContext("webgl") || glCanvas.getContext("experimental-webgl");

  if (!gl) {
    alert('Your browser does not support WebGL');
    return;
  }

  gl.clearColor(0.7,0.7,0.7,1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

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
  const ABLengthLabelSpan = document.getElementById('ABLengthLabel');
  const ThicknessLabelSpan = document.getElementById('ThicknessLabel');
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
    ABLengthLabelSpan.textContent = (tools.mapDistanceMeters(lonlatA,lonlatB)/1e3).toFixed(2);

    const x1 = tools.sub(tools.xy2lonlat([2*state.sectionHalfThickness[0],0]),
                         tools.xy2lonlat([0,0]));
    ThicknessLabelSpan.textContent = (111.1*x1[0]).toFixed(2);
    PitchLabelSpan.textContent = (state.tilt[0]*180/Math.PI).toFixed(2);

    updateXsectionOverlay();

    gl.clearColor(0.7,0.7,0.7,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0/*offset*/, data.vertices.byteLength/data.elementSize/*vertex count*/);
  };

  let lastResize = (new Date()).getTime();
  const resizeObserver = new MutationObserver((mutationsList, observer) => {
    const now = (new Date()).getTime();
    if (now - lastResize > 50) {
      setTimeout(() => {
        if (glCanvas.width !== glCanvas.clientWidth
          || glCanvas.height !== glCanvas.clientHeight) {
          glCanvas.width = glCanvas.clientWidth;
          glCanvas.height = glCanvas.clientHeight;
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
        updateXsectionOverlay();
        loop();
      }, 100);
    }
  });
  resizeObserver.observe(
      document.getElementById("bottomwindowcontent"),
      { attributes: true }
    );
  // window.addEventListener('unload', resizeObserver.disconnect);

  document.body.addEventListener('wheel', (e) => {
    const rect1 = document.getElementById("map-overlay").getBoundingClientRect();
    const pos1 = [(e.clientX - rect1.left)/rect1.width,
                  1-(e.clientY - rect1.top)/rect1.height];
    const rect2 = document.getElementById("xsection").getBoundingClientRect();
    const pos2 = [(e.clientX - rect2.left)/rect2.width,
                  1-(e.clientY - rect2.top)/rect2.height];

    if (pos1[0] > 0.0 && pos1[0] < 1.0 && pos1[1] > 0.0 && pos1[1] < 1.0) {
      e.preventDefault();
      const dZ = -e.deltaY/Math.abs(e.deltaY) * 0.1 * Math.log(state.sectionHalfThickness[0]+1.0-0.00009);
      state.sectionHalfThickness[0] = Math.max(state.sectionHalfThickness[0]+dZ,0.0001);
      window.requestAnimationFrame(()=>{ updateMapOverlay(); loop(); });
    } else if (pos2[0] > 0.0 && pos2[0] < 1.0 && pos2[1] > 0.0 && pos2[1] < 1.0) {
      e.preventDefault();
      state.zoom[0] -= 0.15*e.deltaY/Math.abs(e.deltaY);
      state.zoom[0] = Math.min(Math.max(0.00, state.zoom[0]),10.0);
      window.requestAnimationFrame(loop);
    }
  });
  document.body.addEventListener('mousedown', (e) => startDrag(e));
  document.body.addEventListener('mouseup', (e) => stopDrag(e));
  document.body.addEventListener('mousemove', (e) => {
    if (e.buttons > 0) {
      if (['scroll','ruler_1','ruler_2','ruler_12',"tilt"].includes(state.dragging)) {
        const rect = document.getElementById("xsection").getBoundingClientRect();
        const pos = [(e.clientX - rect.left)/rect.width,
                   1-(e.clientY - rect.top)/rect.height];

        if (pos[0] > 0.0 && pos[0] < 1.0 && pos[1] > 0.0 && pos[1] < 1.0) {
          const dx = [pos[0]-state.dragstartptr[1][0], pos[1]-state.dragstartptr[1][1]];
          if (e.buttons === 4) {
            if (state.dragging === 'scroll') {
              //state.scroll[0] = state.dragstartscroll[0] + dx[0];
              state.scroll[1] = state.dragstartscroll[1] + dx[1];
              const canvasShiftDistance = -(pos[0]-state.dragstartptr[1][0]);
              const xSectionWidth = tools.mapDistanceDegrees(state.pointA, state.pointB);
              const mapShiftDistance = canvasShiftDistance*xSectionWidth;
              tools.doAbsoluteTranslate(state.dragstartpoints[0],
                                        state.dragstartpoints[1],
                                        [mapShiftDistance, 0]);
              window.requestAnimationFrame(()=>{ updateMapOverlay(); loop(); });
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
      } else if (state.dragging === "tiltpan") {
        const rect = document.getElementById("xsection").getBoundingClientRect();
        const pos = [(e.clientX - rect.left)/rect.width,
                   1-(e.clientY - rect.top)/rect.height];
        if (pos[0] > 0.0 && pos[0] < 1.0 && pos[1] > 0.0 && pos[1] < 1.0) {
          const dx = pos[0]-state.dragstartptr[0][0];
          const dy = pos[1]-state.dragstartptr[1][1];

          if (e.buttons === 1) {
            // Change tilt level
            state.tilt[0] -= dy*Math.PI/2;
            state.tilt[0] = Math.min(state.tilt[0], Math.PI/2);
            state.tilt[0] = Math.max(state.tilt[0], 0.0);
            const RulerInfoSpan = document.getElementById('ruler-info');
            const rulerInfo = tools.getRulerProperties(null, state.tilt[0], state.zoom[0]);
            RulerInfoSpan.style.textDecoration = rulerInfo.decoration;
            RulerInfoSpan.title = rulerInfo.title;

            // Rotate view
            const dtheta = Math.max(-3.0, Math.min(-300*dx, 3.0));
            tools.doRotate(dtheta);
          }
          state.dragstartptr[0][0] += dx;
          state.dragstartptr[1][1] += dy;
          window.requestAnimationFrame(()=>{ updateMapOverlay(); loop(); });
        }
      } else if (["A","B","AB"].includes(state.dragging)) {
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
          } else if ((e.buttons === 2 || e.buttons === 4) && state.dragging === 'AB') { // right click drag
            state.pointA[0] = state.dragstartpoints[0][0] + dx[0];
            state.pointA[1] = state.dragstartpoints[0][1] + dx[1];
            state.pointB[0] = state.dragstartpoints[1][0] + dx[0];
            state.pointB[1] = state.dragstartpoints[1][1] + dx[1];
          }
          window.requestAnimationFrame(()=>{ updateMapOverlay(); loop(); });
        }
      }
    }
  });

  const handleKeyDown = function(e) {
    switch (e.code) {
      case 'KeyZ':
        // Grow/shrink in small increments for narrow cross sections.
        const dZ = ((e.key === 'Z') ? 1.0 : -1.0) * 0.1 * Math.log(state.sectionHalfThickness[0]+1.0-0.00009);
        state.sectionHalfThickness[0] = Math.max(state.sectionHalfThickness[0]+dZ,0.0001);
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
    const RulerInfoSpan = document.getElementById('ruler-info');
    const rulerInfo = tools.getRulerProperties(null, state.tilt[0], state.zoom[0]);
    RulerInfoSpan.style.textDecoration = rulerInfo.decoration;
    RulerInfoSpan.title = rulerInfo.title;
    window.requestAnimationFrame(()=>{
      updateXsectionOverlay(); updateMapOverlay(); loop(); });
  });

  document.getElementById("map-div").oncontextmenu = (e) => startDrag(e);
  //document.getElementById("xsection-div").oncontextmenu = (e) => startDrag(e);
  document.getElementById("xsection").oncontextmenu = (e) => startDrag(e);
  document.getElementById("xsection-overlay").oncontextmenu = (e) => startDrag(e);

  window.requestAnimationFrame(loop);
};

window.addEventListener('load',() => {
  setupLegend();
  console.log("Loading data...");
  loadData().then(InitApp, console.error);
});
