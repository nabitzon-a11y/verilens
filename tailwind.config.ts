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
          DEFAULT: '#6D28D9', // 메인 보라색 (Pi 톤)
          light: '#7C3AED',
          dark: '#5B21B6',
          soft: '#EDE9FE',
        },
        surface: {
          DEFAULT: '#F8FAFC', // 화이트-슬레이트 배경
          card: '#FFFFFF',
          muted: '#F1F5F9',
        },
        navy: {
          DEFAULT: '#0F172A', // 진한 본문 텍스트
          900: '#0F172A',
          800: '#FFFFFF',
          700: '#F1F5F9',
          600: '#E2E8F0',
        },
        human: {
          DEFAULT: '#10B981', // Human Verified 강조 (에메랄드)
          light: '#34D399',
          dark: '#059669',
        },
        pi: {
          DEFAULT: '#F59E0B', // Pi 보상 강조 (앰버)
          light: '#D97706', // 라이트 배경에서 가독성 좋은 앰버 텍스트
          dark: '#B45309',
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
