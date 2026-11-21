import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1120', // 베이스 배경
          900: '#0B1120',
          800: '#111A2E',
          700: '#1A2540',
          600: '#26334F',
        },
        human: {
          DEFAULT: '#10B981', // Human Verified 강조 (에메랄드)
          light: '#34D399',
          dark: '#059669',
        },
        pi: {
          DEFAULT: '#F59E0B', // Pi 보상 강조 (앰버)
          light: '#FBBF24',
          dark: '#D97706',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'Segoe UI',
          'sans-serif',
        ],
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        scan: 'scan 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
