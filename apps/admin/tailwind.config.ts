import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fund: { green: '#087f5b', ink: '#14231d', mist: '#eef7f3' }
      }
    }
  },
  plugins: []
};

export default config;
