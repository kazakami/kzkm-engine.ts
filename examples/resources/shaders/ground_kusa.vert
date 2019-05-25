varying vec3 worldPos; 
varying vec2 vUv; 
uniform float raise; 
uniform float time; 
void main() {
    vUv = uv;
    worldPos = position.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * (vec4(position, 1.0)
    + vec4(sin(time / 21.0 + position.x / 3.5) * 0.8, 2.0, sin(time / 25.0 + position.z / 2.3) * 0.7, 0.0) * (raise / 32.0)
    + vec4(normal, 0.0) * (raise / 32.0));
}
