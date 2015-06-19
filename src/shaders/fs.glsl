#ifdef GL_ES
precision highp float;
#endif

//---------------------------------------------------------
// MACROS
//---------------------------------------------------------

#define EPS       0.0001
#define PI        3.14159265
#define HALFPI    1.57079633
#define ROOTTHREE 1.73205081

#define EQUALS(A,B) ( abs((A)-(B)) < EPS )
#define EQUALSZERO(A) ( ((A)<EPS) && ((A)>-EPS) )


//---------------------------------------------------------
// CONSTANTS
//---------------------------------------------------------

// 32 48 64 96 128
#define MAX_STEPS 64

//#define uTMK 20.0
#define TM_MIN 0.05


//---------------------------------------------------------
// SHADER VARS
//---------------------------------------------------------

varying vec2 vUv;
varying vec3 vPos0; // position in world coords
varying vec3 vPos1; // position in object coords
varying vec3 vPos1n; // normalized 0 to 1, for texture lookup

uniform vec3 uOffset; // TESTDEBUG

uniform vec3 uCamPos;

uniform vec3 uColor;      // color of volume
uniform sampler2D uTex;   // 3D(2D) volume texture
uniform vec3 uTexDim;     // dimensions of texture

uniform float fPerRow;
uniform float fPerColumn;

uniform float uTMK;

float gStepSize;
float gStepFactor;

//---------------------------------------------------------
// PROGRAM
//---------------------------------------------------------

// TODO: convert world to local volume space
vec3 toLocal(vec3 p) {
    return p + vec3(0.5);
}

vec4 sampleVolTex(vec3 pos) {
  pos = pos;
  
  // note: z is up in 3D tex coords, pos.z is tex.y, pos.y is zSlice
  float zSlice = (1.0-pos.y)*(uTexDim.z-1.0);   // float value of slice number, slice 0th to 63rd

  float x0 = mod(floor(zSlice), fPerRow)*uTexDim.x +
      pos.x*(uTexDim.x-1.0) +
      0.5;

  float y0 = floor(floor(zSlice)/fPerRow)*uTexDim.y +
      pos.z*(uTexDim.y-1.0) +
      0.5;

  float width = uTexDim.x*fPerRow;
  float height = uTexDim.y*fPerColumn;

  float uni_x0 = min(x0/width, 1.0);
  float uni_y0 = min(y0/height, 1.0);
  float uni_x1;
  float uni_y1;

  if(mod(floor(zSlice)+1.0, fPerRow) == 0.0){
      uni_x1 = min((pos.x*(uTexDim.x-1.0) + 0.5)/width, 1.0);
      uni_y1 = min((y0 + uTexDim.y)/height, 1.0);
  }else{
      uni_x1 = min((x0 + uTexDim.x)/width, 1.0);
      uni_y1 = uni_y0;
  }

  // get (bi)linear interped texture reads at two slices
  vec4 z0 = texture2D(uTex, vec2(uni_x0, uni_y0));
  vec4 z1 = texture2D(uTex, vec2(uni_x1, uni_y1));
  return mix(z0, z1, fract(zSlice));
}

vec4 raymarchNoLight(vec3 ro, vec3 rd) {
    vec3 step = rd*gStepSize;
    vec3 pos = ro;
  
    vec4 col = vec4(0.0);
  
    for (int i=0; i<MAX_STEPS; ++i) {
      //float dtm = exp( -uTMK*gStepSize*sampleVolTex(pos) );
      //tm *= dtm;
      //col += (1.0-dtm) * uColor * tm;
      col += sampleVolTex(pos);
      pos += step;
    
      if (
	  pos.x > 1.0 || pos.x < 0.0 ||
	  pos.y > 1.0 || pos.y < 0.0 ||
	  pos.z > 1.0 || pos.z < 0.0)
	break;
    }
  
    if(col.r > 1.0)col.r = 1.0;
    if(col.g > 1.0)col.g = 1.0;
    if(col.b > 1.0)col.b = 1.0;
    return vec4(col.rgb, 1.0);
}


void main() {
    // in world coords, just for now
    vec3 ro = vPos1n;
    vec3 rd = normalize( ro - toLocal(uCamPos) );
    //vec3 rd = normalize(ro-uCamPos);
  
    // step_size = root_three / max_steps ; to get through diagonal  
    gStepSize = ROOTTHREE / float(MAX_STEPS);
    gStepFactor = 32.0 * gStepSize;
  
    gl_FragColor = raymarchNoLight(ro, rd);
}
