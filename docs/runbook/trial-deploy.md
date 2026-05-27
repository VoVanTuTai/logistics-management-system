# Trial Deploy Runbook

Muc tieu cua deploy thu la chay mot moi truong staging/internal de kiem tra core flow, khong tuyen bo production public.

## Pham vi chap nhan

Deploy thu duoc xem la dat khi:

- Gateway BFF boot duoc va `/health` tra OK.
- Cac service core boot duoc va `/health` tra OK.
- Frontend build duoc va tro ve dung `VITE_GATEWAY_BFF_URL`.
- Dang nhap duoc bang tai khoan seed.
- Chay duoc flow chinh: tao don, tao pickup, scan, assign task, manifest, tracking.
- Log khong co loi lap lai trong 15 phut dau sau deploy.

Nhung phan sau khong chan deploy thu:

- Prototype/placeholder route.
- Analytics nang cao.
- Doi mat khau merchant scaffold.
- Courier mobile POD upload hoan chinh.
- CI/CD production gate day du.

## Dieu kien toi thieu truoc deploy

Chay local cac lenh sau va khong duoc co loi:

```powershell
cd apps\merchant-web
npm run build

cd ..\ops-web
npm run build
npm run test:smoke

cd ..\admin-web
npm run build

cd ..\public-tracking
npm run build

cd ..\courier-mobile
npm run typecheck

cd ..\..\services\gateway-bff
npm run build
```

Voi cac backend service con lai, toi thieu phai typecheck:

```powershell
$services = 'auth-service','shipment-service','pickup-service','dispatch-service','manifest-service','scan-service','delivery-service','tracking-service','masterdata-service','reporting-service','payment-service'
foreach ($s in $services) {
  Push-Location "services\$s"
  npx tsc -p tsconfig.json --noEmit
  if ($LASTEXITCODE -ne 0) { throw "Typecheck failed: $s" }
  Pop-Location
}
```

## Runtime can chuan bi

Ha tang toi thieu:

- PostgreSQL reachable tu moi service.
- RabbitMQ reachable tu cac service co messaging.
- S3-compatible storage cho POD/media neu test upload.
- Static hosting cho `merchant-web`, `ops-web`, `admin-web`, `public-tracking`.
- Node 20 runtime cho backend services.

Gateway can cac bien:

```text
PORT=3000
GATEWAY_AUTH_ENABLED=true
CORS_ORIGINS=https://merchant-staging.example.com,https://ops-staging.example.com,https://admin-staging.example.com,https://tracking-staging.example.com
AUTH_SERVICE_URL=http://auth-service:3010
MASTERDATA_SERVICE_URL=http://masterdata-service:3001
SHIPMENT_SERVICE_URL=http://shipment-service:3002
PICKUP_SERVICE_URL=http://pickup-service:3003
DISPATCH_SERVICE_URL=http://dispatch-service:3004
MANIFEST_SERVICE_URL=http://manifest-service:3005
SCAN_SERVICE_URL=http://scan-service:3006
DELIVERY_SERVICE_URL=http://delivery-service:3007
TRACKING_SERVICE_URL=http://tracking-service:3008
REPORTING_SERVICE_URL=http://reporting-service:3009
PAYMENT_SERVICE_URL=http://payment-service:3011
PRICING_SERVICE_URL=http://pricing-service:3012
S3_REGION=us-east-1
S3_ENDPOINT=https://s3-staging.example.com
S3_ACCESS_KEY=<secret>
S3_SECRET_KEY=<secret>
S3_BUCKET_NAME=nexus-pod-images-staging
S3_FORCE_PATH_STYLE=true
```

Moi backend service co database rieng toi thieu can:

```text
PORT=<service-port>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db_name>
RABBITMQ_URL=amqp://<user>:<password>@<host>:5672
```

Frontend can:

```text
VITE_GATEWAY_BFF_URL=https://gateway-staging.example.com
```

## Thu tu deploy de giam loi

1. Provision PostgreSQL, RabbitMQ va object storage.
2. Deploy `auth-service`, `masterdata-service`, `shipment-service`, `pickup-service`, `dispatch-service`, `manifest-service`, `scan-service`, `delivery-service`, `tracking-service`, `reporting-service`, `payment-service`.
3. Chay db prepare/seed staging co kiem soat. Hien tai repo dung `prisma db push`, chi dung cho staging trial.
4. Deploy `gateway-bff` sau khi tat ca service URL da san sang.
5. Deploy frontend voi `VITE_GATEWAY_BFF_URL` tro ve gateway staging.
6. Bat `GATEWAY_AUTH_ENABLED=true` tren gateway.
7. Kiem tra health va core flow.

## Kiem tra sau deploy

Health check:

```powershell
$urls = @(
  'https://gateway-staging.example.com/health',
  'https://auth-staging.example.com/health',
  'https://masterdata-staging.example.com/health',
  'https://shipment-staging.example.com/health',
  'https://pickup-staging.example.com/health',
  'https://dispatch-staging.example.com/health',
  'https://manifest-staging.example.com/health',
  'https://scan-staging.example.com/health',
  'https://delivery-staging.example.com/health',
  'https://tracking-staging.example.com/health',
  'https://reporting-staging.example.com/health',
  'https://payment-staging.example.com/health'
)
foreach ($url in $urls) {
  Invoke-RestMethod $url
}
```

Core smoke:

- Login Ops.
- Tao shipment.
- Tao pickup request.
- Scan pickup/inbound/outbound.
- Assign hoac reassign task.
- Tao manifest, add shipment, seal/receive.
- Tra cuu tracking public.
- Login Merchant va xem/tim don vua tao.
- Login Admin va xem user/masterdata.

## Diem can ghi ro khi demo

Moi truong nay la staging trial. Cac han che da biet:

- Chua co migration production versioned.
- Auth/password hashing chua dat production security.
- Docker image chua hardening non-root/multi-stage.
- Mot so route UI la prototype hoac scaffold.
- Chua co monitoring/alerting/on-call day du.
