import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          register: path.resolve(__dirname, 'register.html'),
          forgotPassword: path.resolve(__dirname, 'forgot-password.html'),
          resetPassword: path.resolve(__dirname, 'reset-password.html'),
          dashboard: path.resolve(__dirname, 'dashboard.html'),
          competitions: path.resolve(__dirname, 'competitions.html'),
          entries: path.resolve(__dirname, 'entries.html'),
          leaderboard: path.resolve(__dirname, 'leaderboard.html'),
          users: path.resolve(__dirname, 'users.html'),
          javaCode: path.resolve(__dirname, 'java-code.html'),
          notFound: path.resolve(__dirname, '404.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
