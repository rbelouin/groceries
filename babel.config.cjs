module.exports = {
  plugins: ["@babel/plugin-transform-runtime"],
  presets: [
    // Google Apps Script does not support numeric separators (among other things)
    ['@babel/preset-env', {targets: {node: '12'}}],
    '@babel/preset-typescript',
  ],
};
