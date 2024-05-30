const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');
const image = document.querySelector('img');
image.style.display = '';

if (!gl) {
    throw new Error('WebGL not supported');
}

// Vertices 
const vertexData = [//Your co-ordinates are x,y,z but when you use them in the shader you only use x,y. which makes your co-ordinates to misbehave
    //front face
    //I will Remove the zeros that represent the z- cordinate system
    0.5,0.5,// 0,//first quadrat  vertices 0
    -0.5,0.5, //0,//second                     1
    -0.5,-0.5, //0,//3 quadrant                2

    -0.5,-0.5, //0,//3 quadrant                2
    0.5,-0.5, //0,//4 quadrat z is 0 
    0.5,0.5,// 0,//first quadrat  vertices 0
];


/*
It is easier to deal with textures when you are having triangles instead of square(for me at least...), so i divided your square into two triangles and did the same on your textures...
You only created a buffer for texture and not for your vertex data
*/


let buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

// Texture coordinates
const shipTextureCoordinate = new Float32Array([
    1.0, 1.0, // Bottom left
    0.0, 1.0, // Top left
    0.0, 0.0, // Bottom right
    0.0, 0.0, // Bottom right
    1.0, 0.0, // Top right
    1.0, 1.0, // Bottom left
]);

// Create a buffer for the texture coordinates
const shipTextureCoordinateBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, shipTextureCoordinateBuffer);
gl.bufferData(gl.ARRAY_BUFFER, shipTextureCoordinate, gl.STATIC_DRAW);

const shipTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, shipTexture);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // This flips the image orientation to be upright.

if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
} else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
}
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

// Vertex shader
const vsSource = `
    attribute vec2 position;
    attribute vec2 stexCoord;
    varying vec2 vTexCoord;

    void main() {
        vTexCoord = stexCoord;
        gl_Position = vec4(position, 0, 1.0);
        gl_PointSize = 50.0;
    }
`;

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vsSource);
gl.compileShader(vertexShader);

// Error checking for vertex shader
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(`Vertex shader compilation error: ${gl.getShaderInfoLog(vertexShader)}`);
}

// Fragment shader
const fsSource = `
    precision mediump float;
    varying vec2 vTexCoord;
    uniform sampler2D texture;

    void main() {
        gl_FragColor = texture2D(texture, vTexCoord);
        // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // I added this just to see how the square behaves without the texture, it isnt necessary anymore thoo.
    }
`;

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fsSource);
gl.compileShader(fragmentShader);

// Error checking for fragment shader
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(`Fragment shader compilation error: ${gl.getShaderInfoLog(fragmentShader)}`);
}

// Program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

// Linking error
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(`Shader program linking error: ${gl.getProgramInfoLog(program)}`);
}

const positionLocation = gl.getAttribLocation(program, "position");
gl.bindBuffer(gl.ARRAY_BUFFER,buffer); //This ensures that the enabled vertex is for the vertexData
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);


//Atttribute location of texture coordinates
const shipTexCoordLocation = gl.getAttribLocation(program, "stexCoord");
gl.enableVertexAttribArray(shipTexCoordLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, shipTextureCoordinateBuffer); 
gl.vertexAttribPointer(shipTexCoordLocation, 2, gl.FLOAT, false, 0, 0);

gl.clearColor(0, 0, 0, 0); // Set clear color
gl.clear(gl.COLOR_BUFFER_BIT);
gl.useProgram(program);
gl.drawArrays(gl.TRIANGLE_FAN, 0, 3);
gl.drawArrays(gl.TRIANGLE_FAN, 3, 3);



// checks if its to power of two
function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0;
}
