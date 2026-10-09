/**
 * PM2 Ecosystem Configuration for Ultra-Lean Production Deployment
 * Run all 14 microservices and static web servers natively on Apple Silicon.
 * Total RAM footprint: ~500MB (saves >80% RAM compared to 23 Docker containers).
 */

const path = require('node:path');

const ROOT_DIR = __dirname;
const LOG_DIR = path.join(ROOT_DIR, '.tmp/pm2-logs');

const commonEnv = {
  NODE_ENV: 'production',
  RABBITMQ_URL: 'amqp://guest:guest@localhost:5672',
  DOMAIN_EVENTS_EXCHANGE: 'domain.events',
  PRICING_SERVICE_URL: 'http://localhost:3012',
};

module.exports = {
  apps: [
    // 1. Masterdata Service
    {
      name: 'masterdata-service',
      cwd: path.join(ROOT_DIR, 'services/masterdata-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3001,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/masterdata_db',
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'masterdata-out.log'),
      error_file: path.join(LOG_DIR, 'masterdata-err.log'),
      time: true,
    },

    // 2. Shipment Service
    {
      name: 'shipment-service',
      cwd: path.join(ROOT_DIR, 'services/shipment-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3002,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/shipment_db',
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'shipment-out.log'),
      error_file: path.join(LOG_DIR, 'shipment-err.log'),
      time: true,
    },

    // 3. Pickup Service
    {
      name: 'pickup-service',
      cwd: path.join(ROOT_DIR, 'services/pickup-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3003,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/pickup_db',
        SHIPMENT_SERVICE_URL: 'http://localhost:3002',
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'pickup-out.log'),
      error_file: path.join(LOG_DIR, 'pickup-err.log'),
      time: true,
    },

    // 4. Dispatch Service
    {
      name: 'dispatch-service',
      cwd: path.join(ROOT_DIR, 'services/dispatch-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3004,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/dispatch_db',
        DISPATCH_COURIER_OPTIONS: 'CR001,CR002,CR003',
        PICKUP_SERVICE_URL: 'http://localhost:3003',
        SHIPMENT_SERVICE_URL: 'http://localhost:3002',
        MASTERDATA_SERVICE_URL: 'http://localhost:3001',
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'dispatch-out.log'),
      error_file: path.join(LOG_DIR, 'dispatch-err.log'),
      time: true,
    },

    // 5. Manifest Service
    {
      name: 'manifest-service',
      cwd: path.join(ROOT_DIR, 'services/manifest-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3005,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/manifest_db',
        SHIPMENT_SERVICE_URL: 'http://localhost:3002',
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'manifest-out.log'),
      error_file: path.join(LOG_DIR, 'manifest-err.log'),
      time: true,
    },

    // 6. Scan Service
    {
      name: 'scan-service',
      cwd: path.join(ROOT_DIR, 'services/scan-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3006,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/scan_db',
        SHIPMENT_SERVICE_URL: 'http://localhost:3002',
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'scan-out.log'),
      error_file: path.join(LOG_DIR, 'scan-err.log'),
      time: true,
    },

    // 7. Delivery Service
    {
      name: 'delivery-service',
      cwd: path.join(ROOT_DIR, 'services/delivery-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3007,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/delivery_db',
        SCAN_SERVICE_URL: 'http://localhost:3006',
        SHIPMENT_SERVICE_URL: 'http://localhost:3002',
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'delivery-out.log'),
      error_file: path.join(LOG_DIR, 'delivery-err.log'),
      time: true,
    },

    // 8. Tracking Service
    {
      name: 'tracking-service',
      cwd: path.join(ROOT_DIR, 'services/tracking-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3008,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/tracking_db',
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'tracking-out.log'),
      error_file: path.join(LOG_DIR, 'tracking-err.log'),
      time: true,
    },

    // 9. Reporting Service
    {
      name: 'reporting-service',
      cwd: path.join(ROOT_DIR, 'services/reporting-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3009,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/reporting_db',
        REPORTING_CONSUMER_INTERVAL_MS: 1000,
        REPORTING_CONSUMER_BATCH_SIZE: 20,
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'reporting-out.log'),
      error_file: path.join(LOG_DIR, 'reporting-err.log'),
      time: true,
    },

    // 10. Auth Service
    {
      name: 'auth-service',
      cwd: path.join(ROOT_DIR, 'services/auth-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3010,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/auth_db',
        ACCESS_TOKEN_TTL_SECONDS: 900,
        REFRESH_TOKEN_TTL_SECONDS: 2592000,
        MASTERDATA_SERVICE_URL: 'http://localhost:3001',
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'auth-out.log'),
      error_file: path.join(LOG_DIR, 'auth-err.log'),
      time: true,
    },

    // 11. Payment Service
    {
      name: 'payment-service',
      cwd: path.join(ROOT_DIR, 'services/payment-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3011,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/payment_db',
        SHIPMENT_SERVICE_URL: 'http://localhost:3002',
      },
      max_memory_restart: '180M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'payment-out.log'),
      error_file: path.join(LOG_DIR, 'payment-err.log'),
      time: true,
    },

    // 12. Pricing Service
    {
      name: 'pricing-service',
      cwd: path.join(ROOT_DIR, 'services/pricing-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3012,
        PRICING_QUOTE_TTL_MINUTES: 15,
      },
      max_memory_restart: '150M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'pricing-out.log'),
      error_file: path.join(LOG_DIR, 'pricing-err.log'),
      time: true,
    },

    // 13. AI Chatbot Service
    {
      name: 'chatbot-service',
      cwd: path.join(ROOT_DIR, 'services/chatbot-service'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3013,
        TRACKING_SERVICE_URL: 'http://localhost:3008',
        PRICING_SERVICE_URL: 'http://localhost:3012',
        KNOWLEDGE_BASE_DIR: path.join(ROOT_DIR, 'docs/knowledge-base'),
        VECTOR_INDEX_FILE: path.join(ROOT_DIR, 'docs/knowledge-base/vector-index.json'),
      },
      max_memory_restart: '200M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'chatbot-out.log'),
      error_file: path.join(LOG_DIR, 'chatbot-err.log'),
      time: true,
    },

    // 14. Gateway BFF (API Gateway)
    {
      name: 'gateway-bff',
      cwd: path.join(ROOT_DIR, 'services/gateway-bff'),
      script: 'dist/main.js',
      env: {
        ...commonEnv,
        PORT: 3000,
        GATEWAY_AUTH_ENABLED: 'true',
        GATEWAY_BODY_LIMIT: '1mb',
        GATEWAY_RATE_LIMIT_ENABLED: 'true',
        GATEWAY_RATE_LIMIT_WINDOW_MS: 60000,
        GATEWAY_RATE_LIMIT_MAX: 120,
        GATEWAY_RATE_LIMIT_SKIP_PATHS: '/health,/metrics',
        CHAT_DATABASE_URL: 'postgresql://postgres:postgres@localhost:15432/chat_db',
        CHAT_REDIS_URL: 'redis://localhost:6379',
        CHAT_REDIS_CHANNEL: 'gateway-bff:chat',
        CHAT_WS_TICKET_SECRET: 'nexus_chat_ws_ticket_secret_2026',
        CHAT_WS_TICKET_TTL_SECONDS: 60,
        CHAT_REQUIRE_WS_TICKET: 'true',
        AUTH_SERVICE_URL: 'http://localhost:3010',
        DELIVERY_SERVICE_URL: 'http://localhost:3007',
        DISPATCH_SERVICE_URL: 'http://localhost:3004',
        MANIFEST_SERVICE_URL: 'http://localhost:3005',
        MASTERDATA_SERVICE_URL: 'http://localhost:3001',
        PICKUP_SERVICE_URL: 'http://localhost:3003',
        REPORTING_SERVICE_URL: 'http://localhost:3009',
        SCAN_SERVICE_URL: 'http://localhost:3006',
        SHIPMENT_SERVICE_URL: 'http://localhost:3002',
        TRACKING_SERVICE_URL: 'http://localhost:3008',
        PAYMENT_SERVICE_URL: 'http://localhost:3011',
        PRICING_SERVICE_URL: 'http://localhost:3012',
        CHATBOT_SERVICE_URL: 'http://localhost:3013',
        S3_ENDPOINT: 'http://localhost:9000',
        S3_REGION: 'us-east-1',
        S3_ACCESS_KEY: 'minioadmin',
        S3_SECRET_KEY: 'minioadmin123',
        S3_BUCKET_NAME: 'nexus-pod-images',
        S3_FORCE_PATH_STYLE: 'true',
      },
      max_memory_restart: '250M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'gateway-out.log'),
      error_file: path.join(LOG_DIR, 'gateway-err.log'),
      time: true,
    },

    // 15. All-in-One Multi-App Web Static Server
    {
      name: 'nexus-static-web',
      cwd: ROOT_DIR,
      script: 'scripts/serve-static-apps.mjs',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '80M',
      autorestart: true,
      out_file: path.join(LOG_DIR, 'static-web-out.log'),
      error_file: path.join(LOG_DIR, 'static-web-err.log'),
      time: true,
    },
  ],
};
