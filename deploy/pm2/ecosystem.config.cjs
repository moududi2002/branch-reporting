// deploy/pm2/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'branch-api',
      cwd: '/var/www/branch-reporting/apps/api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        API_PORT: 4000,
        TZ: 'Asia/Dhaka',
      },
      max_memory_restart: '512M',
      error_file: '/var/log/branch-reporting/api-error.log',
      out_file: '/var/log/branch-reporting/api-out.log',
      time: true,
    },
    {
      name: 'branch-web',
      cwd: '/var/www/branch-reporting/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_BASE: 'https://reports.example.com/api/v1',
        TZ: 'Asia/Dhaka',
      },
      max_memory_restart: '512M',
      error_file: '/var/log/branch-reporting/web-error.log',
      out_file: '/var/log/branch-reporting/web-out.log',
      time: true,
    },
  ],
};