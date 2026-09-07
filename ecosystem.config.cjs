module.exports = {
  apps: [
    {
      name: "hangtuahpm",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: "/var/www/hangtuahpm",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      max_memory_restart: "512M",
      error_file: "/var/log/hangtuahpm/err.log",
      out_file: "/var/log/hangtuahpm/out.log",
      time: true,
    },
  ],
};
