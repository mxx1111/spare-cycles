/** @type {import('sparepack').Config} */
export default {
  allowlist: [
    "src/**/*.ts"
  ],
  remap: [
    { from: "src/", to: "dist/" }
  ],
  exclude: [
    "src/**/*.test.ts"
  ]
};
