module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ["eslint:recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  ignorePatterns: ["dist", "node_modules"],
  rules: {},
};
