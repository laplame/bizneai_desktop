module.exports = {
  apps: [
    {
      name: 'luxae-main',
      script: 'scripts/start-validator.js',
      cwd: '/var/www/luxae-blockchain',
      env: {
        API_PORT: 3000,
        P2P_PORT: 30303,
        NODE_ENV: 'production',
        NODE_TYPE: 'main'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: '/var/log/luxae/main.log',
      error_file: '/var/log/luxae/main-error.log',
      out_file: '/var/log/luxae/main-out.log'
    },
    {
      name: 'luxae-validator1',
      script: 'scripts/start-validator.js',
      cwd: '/var/www/luxae-blockchain',
      env: {
        API_PORT: 3001,
        P2P_PORT: 30304,
        NODE_ENV: 'production',
        NODE_TYPE: 'validator'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: '/var/log/luxae/validator1.log',
      error_file: '/var/log/luxae/validator1-error.log',
      out_file: '/var/log/luxae/validator1-out.log'
    },
    {
      name: 'luxae-validator2',
      script: 'scripts/start-validator.js',
      cwd: '/var/www/luxae-blockchain',
      env: {
        API_PORT: 3002,
        P2P_PORT: 30305,
        NODE_ENV: 'production',
        NODE_TYPE: 'validator'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: '/var/log/luxae/validator2.log',
      error_file: '/var/log/luxae/validator2-error.log',
      out_file: '/var/log/luxae/validator2-out.log'
    }
  ]
}; 