# 🏗️ SmartWarehouse Backend — Developer Setup Guide

## Yêu cầu hệ thống

| Tool | Phiên bản | Mục đích |
|---|---|---|
| **Docker Desktop** | ≥ 4.x | Chạy containers (MongoDB, Redis, RabbitMQ, services) |
| **Node.js** | ≥ 18.x | Chỉ cần nếu dev local (không Docker) |
| **Git** | ≥ 2.x | Version control |

> ⚠️ **Quan trọng:** Backend chạy hoàn toàn trong Docker. Bạn **KHÔNG CẦN** cài `node_modules` hay chạy `npm install` thủ công — Docker sẽ tự build.

---

## 🚀 Cách chạy (Docker — Khuyến nghị)

### Bước 1: Mở Docker Desktop
Đảm bảo Docker Desktop đang chạy (kiểm tra icon trên taskbar).

### Bước 2: Build và khởi động tất cả services
```bash
cd SupplyChaninManagement_BE
docker-compose up -d --build
```

> Lần đầu build sẽ mất **3-5 phút** (pull images + npm install bên trong Docker).

### Bước 3: Kiểm tra containers
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Kết quả phải hiện **17 containers** đang Running:

| Container | Port | Chức năng |
|---|---|---|
| `sw-api-gateway` | `8888` → `8080` | API Gateway (entry point) |
| `sw-auth-service` | `3001` | Xác thực (JWT RS256) |
| `sw-product-service` | `3002` | Quản lý sản phẩm |
| `sw-inventory-service` | `3003` | Quản lý kho |
| `sw-order-service` | `3004` | Quản lý đơn hàng |
| `sw-shipment-service` | `3005` | Quản lý vận chuyển |
| `sw-notification-service` | `3006` | Thông báo (Socket.IO) |
| `sw-analytics-service` | `3007` | Phân tích dữ liệu |
| `sw-redis` | `6379` | Cache (Redis 7) |
| `sw-rabbitmq` | `5672` / `15672` | Message broker |
| `sw-mongo-*` (×6) | internal | Cơ sở dữ liệu |

### Bước 4: Xác nhận tất cả hoạt động
```bash
# Kiểm tra gateway
curl http://localhost:8888/health

# Kiểm tra sâu tất cả services
curl http://localhost:8888/health/deep
```

---

## 📡 API Endpoints

Tất cả API requests đi qua **API Gateway** tại `http://localhost:8888`:

| Method | Endpoint | Auth? | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | ❌ | Đăng nhập |
| POST | `/api/auth/register` | ❌ | Đăng ký |
| GET | `/api/auth/public-key` | ❌ | Lấy RSA public key |
| GET/POST | `/api/products/**` | ✅ Bearer | CRUD sản phẩm |
| GET/POST | `/api/inventory/**` | ✅ Bearer | Kho + nhập/xuất |
| GET/POST | `/api/warehouses/**` | ✅ Bearer | CRUD kho hàng |
| GET/POST | `/api/sales-orders/**` | ✅ Bearer | Đơn bán hàng |
| GET/POST | `/api/purchase-orders/**` | ✅ Bearer | Đơn mua hàng |
| GET/POST | `/api/customers/**` | ✅ Bearer | CRUD khách hàng |
| GET/POST | `/api/suppliers/**` | ✅ Bearer | CRUD nhà cung cấp |
| GET/POST | `/api/shipments/**` | ✅ Bearer | Vận chuyển |
| GET/POST | `/api/notifications/**` | ✅ Bearer | Thông báo |
| GET | `/api/analytics/**` | ✅ Bearer | Phân tích |

**Header xác thực:** `Authorization: Bearer <JWT_TOKEN>`

---

## 🏛️ Kiến trúc hệ thống

```
                    ┌──────────────┐
    Client ──────►  │ API Gateway  │  :8888
                    │  (Express)   │
                    │ Compression  │
                    │ Rate Limit   │
                    │ Response Cache│
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐      ┌──────────┐       ┌──────────┐
   │  Auth   │      │ Product  │       │ Order    │
   │ :3001   │      │ :3002    │       │ :3004    │
   └────┬────┘      └────┬─────┘       └────┬─────┘
        │                │                   │
        ▼                ▼                   ▼
   MongoDB          MongoDB             MongoDB
                                            │
                                   ┌────────┼────────┐
                                   ▼        ▼        ▼
                              RabbitMQ   Redis    Socket.IO
                              (events)  (cache)  (realtime)
```

### Infrastructure Layer
- **Redis 7**: Shared caching (TTL 5 min default), Gateway response cache, Socket.IO adapter
- **RabbitMQ 3.13**: Event-driven messaging (Topic Exchange `smartwarehouse.events`)
- **MongoDB 7**: 6 databases riêng biệt (1 per domain)

### Event-Driven Flow
```
Order Created  ──► RabbitMQ ──► Notification Service (Socket.IO broadcast)
                           ──► Analytics Service (materialized counters)

Order Shipped  ──► RabbitMQ ──► Inventory Service (auto-export stock)
                           ──► Notification Service (alert)

Order Cancelled ──► RabbitMQ ──► Inventory Service (rollback stock)
```

---

## 🔧 Các lệnh hữu ích

```bash
# Xem logs của 1 service
docker logs sw-order-service --tail 50 -f

# Restart 1 service (không rebuild)
docker-compose restart order-service

# Rebuild và restart 1 service cụ thể
docker-compose up -d --build order-service

# Dừng tất cả
docker-compose down

# Dừng + xoá volumes (⚠️ MẤT DỮ LIỆU)
docker-compose down -v

# Xem resource usage
docker stats
```

---

## 🐰 RabbitMQ Management UI

- **URL:** http://localhost:15672
- **User:** `admin`
- **Password:** `admin`

Dùng để:
- Xem queues và message rates
- Monitor consumers
- Debug dead-letter messages

---

## 🔑 RSA Keys (Auth Service)

Auth service dùng RSA-256 để ký JWT. Keys nằm trong:
```
services/auth-service/keys/
├── private.pem    # Private key (ký token)
└── public.pem     # Public key (verify token)
```

> ⚠️ **KHÔNG commit private key vào Git.** File `.gitignore` đã loại trừ thư mục `keys/`.

---

## 🚨 Troubleshooting

### Container bị restart liên tục
```bash
docker logs sw-<service-name> --tail 30
```
Nguyên nhân phổ biến:
- MongoDB chưa ready → đợi healthcheck
- RabbitMQ chưa ready → auto-reconnect (tối đa 10 lần)

### Port bị chiếm
```bash
# Kiểm tra process dùng port (ví dụ 8888)
netstat -ano | findstr :8888
# Kill process
taskkill /PID <PID> /F
```

### Không kết nối được Redis/RabbitMQ
Kiểm tra container đang chạy:
```bash
docker ps | findstr "redis\|rabbitmq"
```

### Build lỗi `npm ci`
Nếu thêm/xoá dependency, cần cập nhật `package-lock.json`:
```bash
cd services/<service-name>
npm install
```
Rồi rebuild Docker.

---

## 📁 Cấu trúc thư mục

```
SupplyChaninManagement_BE/
├── docker-compose.yml          # Orchestration (17 containers)
├── README.md                   # Tài liệu này
└── services/
    ├── api-gateway/            # Entry point, proxy, compression, cache
    ├── auth-service/           # JWT RS256, login/register
    ├── product-service/        # CRUD sản phẩm + Redis cache
    ├── inventory-service/      # Kho + RabbitMQ consumer
    ├── order-service/          # Đơn hàng + RabbitMQ publisher
    ├── shipment-service/       # Vận chuyển + event publishing
    ├── notification-service/   # Socket.IO + RabbitMQ consumer
    ├── analytics-service/      # Dashboard + RabbitMQ stream
    └── shared/                 # Shared utilities (cache, eventBus)
```

Mỗi service có cấu trúc:
```
<service>/
├── Dockerfile
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts               # Entry point
    ├── config/                # Database + environment
    ├── models/                # Mongoose schemas
    ├── routes/                # Express routes
    ├── controllers/           # Request handlers
    ├── services/              # Business logic
    ├── consumers/             # RabbitMQ event handlers (nếu có)
    └── utils/                 # cache.ts, eventBus.ts, healthCheck.ts
```
