#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

/**
 * How many times the plane is folded.
 * Each fold mirrors everything the previous ones have drawn, so the stroke count grows fast.
 */
const int FOLDS = 8;

/**
 * Sharpness of the exponential smooth min that fuses every stroke into one field.
 * Larger is closer to a hard min. Too large and the exponentials underflow, taking `acc` to zero.
 */
const float K = 16.0;

const float PI = acos(-1.0);
const float TAU = 2.0 * PI;

mat2 r2d(float t)
{
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

mat3 orthbas(vec3 z)
{
  z = normalize(z);
  vec3 up = abs(z.y) < 0.99 ? vec3(0.0,1.0,0.0) : vec3(0.0,0.0,1.0);
  vec3 x = normalize(cross(up,z));
  return mat3(x,cross(z,x),z);
}

vec3 cyclic(vec3 p,float pers,float lacu)
{
  vec4 sum = vec4(0);
  mat3 rot = orthbas(vec3(2,-3,1));

  for(int i = 0; i < 5; i++)
  {
    p *= rot;
    p += sin(p.zxy);
    sum += vec4(cross(cos(p),sin(p.yzx)),1);
    sum /= pers;
    p *= lacu;
  }

  return sum.xyz / sum.w;
}

/**
 * Distance to the line art.
 *
 * Each iteration translates and rotates the plane, then mirrors it across the y axis.
 * The three strokes seeded per iteration - the mirror axis, a dot and a ring - are therefore
 * copied by every fold that follows, which is where the density comes from.
 */
float map(vec2 p)
{
  // breathing zoom, offset to keep the cluster of folds inside the frame
  vec3 cy = cyclic(vec3(t,1,2),0.83,1.2);
  p = (3.0 + cy.z) * p + vec2(0.3,0.7) - cy.xy;

  float acc = 0.0;

  for(int i = 0; i < FOLDS; i++)
  {
    vec3 h = 0.5 + 0.5 * cyclic(vec3(float(i),1,t),0.83,1.2);

    p = (p - h.xy) * r2d(TAU * (h.z - 0.5));

    float i_l = length(p);
    p.x = abs(p.x);

    acc += exp(-K * p.x) + exp(-2.0 * K * min(i_l,abs(i_l - 0.35 * h.z)));
  }

  // exponential smooth min
  return -log(acc) / K;
}

void main()
{
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float d = map(p);

  // resolve the strokes to a constant width in screen space
  float i_shape = smoothstep(1.5,0.5,d / fwidth(d));

  outColor = vec4(vec3(i_shape),1.0);
}
