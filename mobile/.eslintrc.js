module.exports = {
  root: true,
  extends: ['@react-native'],
  rules: {
    // Relax rules that conflict with project conventions
    'react/react-in-jsx-scope': 'off',
    'no-catch-shadow': 'off',
  },
};
