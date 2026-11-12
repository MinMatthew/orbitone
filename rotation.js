// d3's projection.rotate([lambda, phi, gamma]) as a 3x3 matrix (rows: view X toward viewer, Y right, Z up), and back.
const RAD = Math.PI / 180;

export function multiply(a, b) {
  return a.map(row => [0, 1, 2].map(j => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));
}

export function anglesToMatrix([lambda, phi, gamma]) {
  const cl = Math.cos(lambda * RAD), sl = Math.sin(lambda * RAD);
  const cp = Math.cos(phi * RAD), sp = Math.sin(phi * RAD);
  const cg = Math.cos(gamma * RAD), sg = Math.sin(gamma * RAD);
  const pg = [[cp, 0, -sp], [-sg * sp, cg, -sg * cp], [cg * sp, sg, cg * cp]];
  return multiply(pg, [[cl, -sl, 0], [sl, cl, 0], [0, 0, 1]]);
}

export function matrixToAngles(m) {
  const sp = Math.max(-1, Math.min(1, -m[0][2])), cp = Math.sqrt(1 - sp * sp);
  // At the poles gamma and lambda are interchangeable, so fix gamma.
  const gamma = cp < 1e-9 ? 0 : Math.atan2(-m[1][2], m[2][2]);
  const cg = Math.cos(gamma), sg = Math.sin(gamma);
  const s = cg * m[1][0] + sg * m[2][0];
  const c = m[0][0] * cp + (-sg * m[1][0] + cg * m[2][0]) * sp;
  return [Math.atan2(s, c) / RAD, Math.asin(sp) / RAD, gamma / RAD];
}

// Rotation by `theta` radians about the unit axis (x, y, z).
export function axisRotation([x, y, z], theta) {
  const c = Math.cos(theta), s = Math.sin(theta), k = 1 - c;
  return [
    [c + k * x * x, k * x * y - s * z, k * x * z + s * y],
    [k * y * x + s * z, c + k * y * y, k * y * z - s * x],
    [k * z * x - s * y, k * z * y + s * x, c + k * z * z],
  ];
}
