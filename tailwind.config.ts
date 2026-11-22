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
        brand: {
          DEFAULT: '#703C90', // Pi Browser 메인 플럼 퍼플
          light: '#864EA8',
          dark: '#592B75',
          soft: '#F3ECF8',
        },
        surface: {
          DEFAULT: '#FFFFFF', // Pi Browser 클린 화이트 배경
          card: '#FFFFFF',
          muted: '#F8F6FA',
        },
        navy: {
          DEFAULT: '#1E1B2E', // 진한 본문 텍스트
          900: '#1E1B2E',
          800: '#FFFFFF',
          700: '#F8F6FA',
          600: '#E5DFEC',
        },
        human: {
          DEFAULT: '#10B981', // Human Verified 강조 (에메랄드)
          light: '#34D399',
          dark: '#059669',
        },
        pi: {
          DEFAULT: '#E0A842', // Pi 골드
          light: '#C68B20', // 화이트 배경 가독성 좋은 Pi 골드
          dark: '#A67114',
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
