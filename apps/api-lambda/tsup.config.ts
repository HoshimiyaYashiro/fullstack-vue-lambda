import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'handlers/health': 'src/handlers/health.ts',
    'handlers/auth/login': 'src/handlers/auth/login.ts',
    'handlers/users/get-profile': 'src/handlers/users/get-profile.ts',
    'handlers/admin/list-users': 'src/handlers/admin/list-users.ts',
    'handlers/admin/metrics': 'src/handlers/admin/metrics.ts',
  },
  format: ['esm'],
  target: 'node20',
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  bundle: true,
  minify: false,
  treeshake: true,
});
