module.exports = {
  extends: ["@repo/config-eslint/node"],
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
  },
};