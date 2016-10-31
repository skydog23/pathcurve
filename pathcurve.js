var sprintf = require('sprintf');
var THREE = require('./libs/threejs/three.js');
var EventTracker = require('./EventTracker.js');
var axes = require('./axes.js');
var kbd_processor = require('./kbd_processor.js');
var ui = require('./ui.js');
var parametersToCurve = require('./parametersToCurve.js');

var pathcurve = {};
window.pathcurve = pathcurve;

pathcurve.state = {
    mouseDragMode: "rotate"   // or "translate"
};

pathcurve.settings = {
    backgroundColor: 0x000000,
    lights: {
        directional: [
            { position: [ 0,  0, 10], color: 0xffffff, intensity: 0.4 },
            { position: [10,  0,  0], color: 0xffffff, intensity: 0.4 },
            { position: [ 0, 10,  0], color: 0xffffff, intensity: 0.4 }
        ]
    },
    camera: {
        fov: 45,
        position: [-1,1,1],
        near: 0.1,
        far: 6,
        up: [0,0.1,1],
        lookAt: [0,0,0]
    }
};

var controlsInputsDefaults = {
    size: 4,
    maxLength: 8,
    step: 0.01,
}

var size = 4;
var maxLength = 8;
var controlsInputs = [{
    size: controlsInputsDefaults.size,
    maxLength: controlsInputsDefaults.maxLength,
    text: "lambda",
    name: "lambda",
    value: -1.0,
    minValue: -2.0,
    maxValue: 2.0,
    step: controlsInputsDefaults.step,
    tooltiptext: "Ratio of two real eigenvalues",
},{
    size: controlsInputsDefaults.size,
    maxLength: controlsInputsDefaults.maxLength,
    text: "epsilon",
    name: "epsilon",
    value: 1.0,
    minValue: -2.0,
    maxValue: 2.0,
    step: controlsInputsDefaults.step,
    tooltiptext: "Strength of complex conjugate eigenvalues",
},{
    size: controlsInputsDefaults.size,
    maxLength: controlsInputsDefaults.maxLength,
    text: "length of curves",
    name: "speed",
    value: 1.0,
    minValue: 0.0,
    maxValue: 2.0,
    step: controlsInputsDefaults.step,
    tooltiptext: "Lengthen or shorten curves",
},{
    size: controlsInputsDefaults.size,
    maxLength: controlsInputsDefaults.maxLength,
    text: "initial radius",
    name: "iradius",
    value: 0.5,
    minValue: 0.0,
    maxValue: 1.0,
    step: controlsInputsDefaults.step,
    tooltiptext: "Radius of initial circle in z=.5 plane",
},{
    size: controlsInputsDefaults.size,
    maxLength: controlsInputsDefaults.maxLength,
    text: "number of curves",
    name: "ncurves",
    value: 24,
    minValue: 1,
    maxValue: 100,
    step: 1,
    tooltiptext: "Number of curves",
},{
    size: controlsInputsDefaults.size,
    maxLength: controlsInputsDefaults.maxLength,
    text: "total angle",
    name: "tangle",
    value: 6.283,
    minValue: 0.0,
    maxValue: 6.283,
    step: controlsInputsDefaults.step,
    tooltiptext: "Size of sector around z-axis to display curves",
}, {
    size: controlsInputsDefaults.size,
    maxLength: controlsInputsDefaults.maxLength,
    text: "fog factor",
    name: "fogfactor",
    value: .8,
    minValue: 0.5,
    maxValue: 2.0,
    step: 0.01,
    tooltiptext: "Control amount of fog"
}];

function createCamera(width, height) {
    var camera = new THREE.PerspectiveCamera( pathcurve.settings.camera.fov,
                                              width / height,
                                              pathcurve.settings.camera.near,
                                              pathcurve.settings.camera.far);
    camera.matrixAutoUpdate = false;

    camera.position.set(pathcurve.settings.camera.position[0],
                        pathcurve.settings.camera.position[1],
                        pathcurve.settings.camera.position[2]);
    camera.up.set(pathcurve.settings.camera.up[0],
                  pathcurve.settings.camera.up[1],
                  pathcurve.settings.camera.up[2]);
    camera.lookAt(new THREE.Vector3(pathcurve.settings.camera.lookAt[0],
                                    pathcurve.settings.camera.lookAt[1],
                                    pathcurve.settings.camera.lookAt[2]));

    camera.updateMatrix();
    camera.matrixWorldNeedsUpdate = true;
    return camera;
}

function updateCurves() {
    var params = { 
        lambda: parseFloat($("#lambda").val()),
        epsilon: parseFloat($("#epsilon").val()),
        speed: parseFloat($("#speed").val()),
        iradius: parseFloat($("#iradius").val()),
        ncurves: parseFloat($("#ncurves").val()),
        tangle: parseFloat($("#tangle").val()),
        fogfactor: parseFloat($("#fogfactor").val())
    };
    pathcurve.scene.fog = new THREE.Fog( 0x000000, 1.0, 1.0+params.fogfactor*pathcurve.settings.camera.far/3);
    if (Math.abs(params.tangle - 2* Math.PI) < .01) params.tangle = 2 * Math.PI;

    var i, j, rot = new THREE.Matrix4();
    var dAngle = params.tangle / ( params.ncurves===1 ? 1 : (params.ncurves - 1) );
    pathcurve.world.remove(pathcurve.curveLayers);
    pathcurve.curveLayers = new THREE.Object3D();
    pathcurve.world.add(pathcurve.curveLayers);
    pathcurve.nlayers = 1;
    for (j=0; j<params.ncurves; ++j) {
        var curves = new THREE.Object3D();
        for (i = 0; i < pathcurve.nlayers; ++i)	{
            var factor = (i+1)/pathcurve.nlayers;
            var curve = parametersToCurve.parametersToCurve(
                500,
                new THREE.Vector4(factor * params.iradius, 0, 0, 1),
                params.speed,
                params.lambda,
                params.epsilon
            );
            var mat = new THREE.LineBasicMaterial({
                color: 0xffffff,
                linewidth: 1,
                fog: true
            });
            var geom = new THREE.Geometry();
            curve.forEach(function(v4) {
                geom.vertices.push(new THREE.Vector3(v4.x/v4.w, v4.y/v4.w, v4.z/v4.w));
            });
	    var lineSegmentsObj = new THREE.Line(geom, mat);
	    curves.add(lineSegmentsObj);
        }
        var angle = j*dAngle;
        var poobah  = new THREE.Object3D();
	poobah.add(curves);
        poobah.rotateZ(angle);
        poobah.matrixWorldNeedsUpdate = true;
        //poobah.matrixAutoUpdate = false;
	//poobah.updateMatrixWorld();
        pathcurve.curveLayers.add(poobah);
	console.log(i);
    }
}

function addControls($container) {
    controlsInputs.forEach(function(inputs) {
        ui.add_slider_widget($container, inputs);
    });
    $('[data-toggle="tooltip"]').tooltip();
    addControlsToggle($container);
}

function addControlsToggle($panel) {
    var whenOpen = 'fa-times-circle';
    var whenClosed = 'fa-cog';
    $toggleIcon = $('#controls-toggle').find('i');
    $panel.on('hide.bs.collapse', function() {
      $toggleIcon.removeClass(whenOpen).addClass(whenClosed);
    }).on('show.bs.collapse', function () {
      $toggleIcon.removeClass(whenClosed).addClass(whenOpen);
    });
    $('[data-toggle="tooltip"]').tooltip();
}


pathcurve.launch = function(canvas, width, height) {

    var renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });
    renderer.setSize( width, height );
    renderer.setClearColor(pathcurve.settings.backgroundColor, 1);

    var camera = createCamera(width, height);
    pathcurve.camera = camera;
    pathcurve.world = new THREE.Object3D();
    pathcurve.world.matrixAutoUpdate = false;

    pathcurve.axes = axes.axes3D({
        length: 0.75,
        tipRadius: 0.05,
        tipHeight: 0.3
    });
    pathcurve.world.add(pathcurve.axes);

    pathcurve.curveLayers = new THREE.Object3D();
    pathcurve.world.add(pathcurve.curveLayers);

    var scene = new THREE.Scene();
    pathcurve.scene = scene
    scene.add( camera );
    scene.add( pathcurve.world );
    scene.add( new THREE.AmbientLight( 0x222222 ) );
    scene.fog = new THREE.Fog( 0x000000, 1.0, 1.0+pathcurve.settings.camera.far/3);
    pathcurve.settings.lights.directional.forEach(function(lt) {
        var light = new THREE.DirectionalLight( lt.color, lt.intensity );
        light.position.set(lt.position[0], lt.position[1], lt.position[2]);
        scene.add( light );
    });

    function render() {
        renderer.render( scene, camera );
    };

    pathcurve.requestRender = function(f) {
        // optional arg f is a function that will be called immediately after rendering happens
        if (typeof(f)==='function') {
            requestAnimationFrame( function() {
                render();
                f();
            });
        } else {
            requestAnimationFrame( render );
        }
    };

    var commands = [
        {
            seq: "t",
            action: function() {
                pathcurve.state.mouseDragMode = "translate";
            }
        },
        {
            seq: "r",
            action: function() {
                pathcurve.state.mouseDragMode = "rotate";
            }
        }
    ];
    var kp = kbd_processor(commands);

    var moving = pathcurve.world;
    var center = pathcurve.axes;
    var frame  = pathcurve.camera;
    var eventTracker = EventTracker.eventTracker(canvas, {
        mouseDown: function() {
            if (pathcurve.timeout) {
                clearTimeout(pathcurve.timeout);
                pathcurve.timeout = undefined;
            }
        },
        mouseUp: function(p, dt, d, event) {
            //console.log(sprintf('mouseUp   p = (%3d,%3d)', p.x, p.y));
            //console.log(sprintf('mouseUp   d = (%3d,%3d)', d.x, d.y));
            if (dt < 50 && pathcurve.state.mouseDragMode === "rotate") {
                function inertia() {
                    moving.matrix.multiplyMatrices(moving.matrix, pathcurve.lastM);
                    moving.matrixWorldNeedsUpdate = true;
                    pathcurve.requestRender();
                    pathcurve.timeout = setTimeout(inertia, 4*pathcurve.lastDT);
                }
                pathcurve.timeout = setTimeout(inertia, 4*pathcurve.lastDT);
            }
        },
        mouseDrag: function(p, dp, button, t) {
            // Note: the axis of rotation for a mouse displacement of (dp.x,dp.y) would
            // normally be (-dp.y, dp.x, 0), but since the y direction of screen coords
            // is reversed (increasing towards the bottom of the screen), we need to negate
            // the y coord here; therefore we use (dp.y, dp.x, 0):
            var v, d, angle, L=null;
            if (pathcurve.state.mouseDragMode === "rotate") {
                if (button === 0) {
                    v = new THREE.Vector3(dp.y, dp.x, 0).normalize();
                    d = Math.sqrt(dp.x*dp.x + dp.y*dp.y);
                    angle = (d / canvas.width) * Math.PI;
                    L = new THREE.Matrix4().makeRotationAxis(v, angle);
                } else if (button === 1) {
                    v = new THREE.Vector3(dp.y, dp.x, 0).normalize();
                    d = Math.sqrt(dp.x*dp.x + dp.y*dp.y);
                    angle = (d / canvas.width) * Math.PI;
                    if (dp.x - dp.y < 0) { angle = -angle; }
                    L = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), angle);
                }
            } else if (pathcurve.state.mouseDragMode === "translate") {
                L = new THREE.Matrix4().makeTranslation(dp.x/200, -dp.y/200, 0);
            }
            if (L) {
                var M = EventTracker.computeTransform(moving,center,frame, L);
                moving.matrix.multiplyMatrices(moving.matrix, M);
                moving.matrixWorldNeedsUpdate = true;
                pathcurve.lastM = M;
                pathcurve.lastDT = pathcurve.lastT - t;
                pathcurve.lastT = t;
                pathcurve.requestRender();
            }
        },
        mouseWheel: function(delta, p) {
            var s = Math.exp(delta/20.0);
            var R = new THREE.Matrix4().makeScale(s,s,s);
            var M = EventTracker.computeTransform(moving,center,frame, R);
            moving.matrix.multiplyMatrices(moving.matrix, M);
            moving.matrixWorldNeedsUpdate = true;
            pathcurve.requestRender();
        },
        keyPress: function(event) {
            kp.key(event.key);
        }
    });

    addControls($('#controls'));

    $('div.inputrow input').change(function() {
        updateCurves();
        pathcurve.requestRender();
    });

    updateCurves();
    pathcurve.requestRender();
};

module.exports = pathcurve;
