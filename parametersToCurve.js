var THREE = require('./libs/threejs/three.js');

var coordinateSystem = new THREE.Matrix4();
coordinateSystem.set(1,0,0,0,   0,1,0,0,  0,0,-.5,.5,  0,0,1,1);

function parametersToCurve(
    numberSteps,    // # of points on curve
    initialPoint,   // 4-tuple
    speed,          // strength of motion
    lambda,         // shape of vertical cross-section
    epsilon) {      // amount of rotation around vertical
    var curve = []; // double[][] curve = new double[numberSteps][4];
    
    // remap parameters to +/- infinity
    // probably belongs in the calling program
    var /* double */ xlambda = lambda;
    if (lambda < -1) xlambda = -1.0/(lambda+2.001);
    else if (lambda > 1) xlambda =  1.0/(2.001-lambda);
    var /* double */ xepsilon = epsilon;
    if (epsilon < -1) xepsilon = -1.0/(epsilon+2.001);
    else if (epsilon > 1) xepsilon =  1.0/(2.001-epsilon);
    if (xepsilon != 0) xepsilon = 1.0/xepsilon;
    else xepsilon = 10E8;

    var /* double[][] */ eigenvalues = parametersToEigenvalues(speed, xlambda, xepsilon);

    // the time parameter runs from -speed to +speed
    var /* double */ increment = 4* speed * 2.0/(numberSteps-1);
    var i, t, m, mm;
    for (i = 0; i<numberSteps; ++i) {
        /* double */ t = -4*speed + i* increment;
        m = exponentialMatrixAtTime(eigenvalues, t); // should return Matrix4

        mm = new THREE.Matrix4();
        mm.copy(coordinateSystem);
        mm.multiply(m);
        var coordinateSystemInv = new THREE.Matrix4();
        coordinateSystemInv.getInverse(coordinateSystem);
        mm.multiply(coordinateSystemInv);

        var newPoint = new THREE.Vector4();
        newPoint.copy(initialPoint);
        newPoint.applyMatrix4(mm);
        curve.push(newPoint);
    }

    return curve;
}

function parametersToEigenvalues(
    /* double */ speed,
    /* double */ lambda,
    /* double */ epsilon)  {
    var /* double */ k1 = lambda;
    var /* double */ k2 = 1;
    // normalize the entries to avoid big entries
    if (Math.abs(k1) > Math.abs(k2)) {
        k2 = k2/Math.abs(k1);
        k1 = k1/Math.abs(k1);
    } else {
        k1 = k1/Math.abs(k2);
        k2 = k2/Math.abs(k2);
    }
    k0 = 1;
    // more normalizing to avoid big entries
    if (Math.abs(epsilon) > 1) {
        k0 = k0/epsilon;
    } else {
        k1 = epsilon*k1; k2 = epsilon*k2;
    }
    // System.err.println("k0, k1, k2: "+k0+" "+k1+" "+k2);
    var eigenvalues = [[0,  k0],
                       [0, -k0],
                       [k1, 0],
                       [k2, 0]];
    return eigenvalues;
}

// should return Matrix4
function exponentialMatrixAtTime(
    /*double[][] */ eigenvalues,
    /*double */ d) {
    var /* int */ n = eigenvalues.length;
    var exp = [[0,0],
               [0,0],
               [0,0],
               [0,0]];
    var i;
    for (i = 0; i<n; ++i)   {
        exp[i][0] = d * eigenvalues[i][0];  // real part
        exp[i][1] = d * eigenvalues[i][1];  // imag part
        var /*double*/ rr = Math.exp(exp[i][0]);
        var /*double*/ c = Math.cos(exp[i][1]);
        var /*double*/ s = Math.sin(exp[i][1]);
        exp[i][0] = rr * c;
        exp[i][1] = rr * s;
    }
    var m = [0,0,0,0,
             0,0,0,0,
             0,0,0,0,
             0,0,0,0];
    for (i = 0; i<4; ++i)   {
        if (exp[i][1] != 0) {
            m[i*4+i] = m[(i+1)*4+i+1] = exp[i][0];
            m[i*4+i+1] = -exp[i][1];
            m[(i+1)*4+i] = exp[i][1];
            i++;
        } else
            m[i*4+i] = exp[i][0];
    }
    var mm = new THREE.Matrix4();
    mm.fromArray(m); // TODO: transpose?
    return mm;
}

// function main() {
//     var curve = parametersToCurve(
//         21, 
//         new THREE.Vector4(0.5,0,0,1), 
//         1.0, 
//         1.0, 
//         1.0, 
//         1.0);
//     console.log(curve);
// }
// 
// console.log('running main');
// main();
// console.log('done main');

module.exports = {
    parametersToCurve : parametersToCurve,
    parametersToEigenvalues : parametersToEigenvalues,
    exponentialMatrixAtTime : exponentialMatrixAtTime
};

