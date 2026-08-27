# Enterprise Turborepo (Vue 3 + AWS Lambda Node.js + Biome)

Hệ thống monorepo chuẩn enterprise được xây dựng trên nền tảng **Turborepo v2** và **pnpm**, phục vụ kiến trúc phân tán gồm 2 ứng dụng Frontend Vue 3 (User & Admin), 1 dịch vụ Backend AWS Lambda (Clean Architecture) và các package chia sẻ dùng chung.

---

## 🏛 Cấu Trúc Dự Án (Repository Structure)

```text
.
├── apps/
│   ├── user-web/              # [Frontend] Vue 3 Client Application (Port 3000)
│   │   ├── src/               # Router, Pinia, Views (Home, Profile)
│   │   └── vite.config.ts     # Vite bundler & API proxy
│   │
│   ├── admin-web/             # [Frontend] Vue 3 Admin Dashboard (Port 3001)
│   │   ├── src/               # Sidebar layout, User management, System metrics
│   │   └── vite.config.ts     # Vite bundler & API proxy
│   │
│   └── api-lambda/            # [Backend] AWS Lambda Node.js (TypeScript)
│       ├── src/
│       │   ├── core/          # Errors, Response formatters, Types
│       │   ├── middleware/    # withMiddleware, Zod body/query validators
│       │   ├── modules/       # Clean Architecture (Services & Repositories)
│       │   ├── handlers/      # Lambda Handlers (Độc lập & Tree-shaked)
│       │   └── local-server.ts# Dev HTTP server giả lập API Gateway (Port 4000)
│       └── tsup.config.ts     # Đóng gói handler thành các bundle độc lập
│
├── packages/
│   ├── shared/                # [Shared] Types, DTOs, Zod Validation Schemas (Isomorphic cho cả FE & BE)
│   ├── ui/                    # [Shared FE] Naive UI Design System, theme overrides, AppConfigProvider
│   ├── api-client/            # [Shared FE] TanStack Query, HTTP client & reusable query hooks
│   └── tsconfig/              # [Shared] Cấu hình TypeScript chuẩn (Base, Vue, Node)
│
├── biome.json                 # Cấu hình Biome Linter & Formatter
├── turbo.json                 # Cấu hình Turborepo Pipeline Caching
└── pnpm-workspace.yaml        # Khai báo pnpm workspaces
```

---

## 🚀 Khởi Chạy Nhanh (Getting Started)

### 1. Yêu Cầu Môi Trường
- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0`

### 2. Cài Đặt Dependencies
```bash
pnpm install
```

### 3. Khởi Chạy Chế Độ Development
Khởi chạy đồng thời cả 2 ứng dụng Frontend và Backend Lambda dev server qua Turborepo:
```bash
pnpm dev
```

Các dịch vụ sẽ sẵn sàng tại:
- **User Web App**: [http://localhost:3000](http://localhost:3000)
- **Admin Web App**: [http://localhost:3001](http://localhost:3001)
- **AWS Lambda Local Gateway**: [http://localhost:4000](http://localhost:4000)

---

## 🛠 Lệnh Vận Hành (Scripts & Tooling)

| Lệnh | Mô tả |
| :--- | :--- |
| `pnpm dev` | Chạy toàn bộ các ứng dụng ở chế độ hot-reload |
| `pnpm dev:user` | Chạy riêng User Web App (Port 3000) |
| `pnpm dev:admin` | Chạy riêng Admin Web App (Port 3001) |
| `pnpm dev:lambda` | Chạy riêng Lambda Local Dev Gateway (Port 4000) |
| `pnpm build` | Biên dịch toàn bộ packages, bundle Lambda handlers và build FE production |
| `pnpm build:user` | Build riêng User Web App (`apps/user-web`) |
| `pnpm build:admin` | Build riêng Admin Web App (`apps/admin-web`) |
| `pnpm build:lambda` | Bundle riêng AWS Lambda Backend (`apps/api-lambda`) |
| `pnpm lint` | Kiểm tra toàn bộ mã nguồn bằng **Biome** siêu tốc |
| `pnpm lint:fix` | Tự động sửa lỗi lint và định dạng lại mã nguồn bằng Biome |
| `pnpm format` | Định dạng code bằng Biome |
| `pnpm check` | Kiểm tra kiểu dữ liệu TypeScript trên toàn bộ monorepo |
| `pnpm clean` | Dọn dẹp thư mục `dist` và cache `.turbo` |

---

## 💡 Điểm Nhấn Thiết Kế Cho Doanh Nghiệp (Enterprise Highlights)

### 1. Đồng Bộ Hóa Validation Schema (`@repo/shared`)
DTOs và Zod schemas được đặt tập trung tại `@repo/shared`. Cả 2 ứng dụng Frontend và Lambda Backend cùng import chung một schema validation:
- Khi người dùng nhập form ở Vue, form được validate theo Zod schema ngay trên browser.
- Khi request gửi lên Lambda, middleware `validateBody(schema, event.body)` kiểm tra lại một lần nữa đảm bảo toàn vẹn dữ liệu.

### 2. Đóng Gói AWS Lambda Tối Ưu Cold Start (`tsup`)
Từng Lambda handler (`health.ts`, `auth/login.ts`, `users/get-profile.ts`, `admin/list-users.ts`) được biên dịch thành 1 file bundle JavaScript duy nhất, tree-shake toàn bộ code không sử dụng, giúp giảm đáng kể thời gian khởi động (Cold Start) khi triển khai trên AWS Lambda / API Gateway.

### 3. Tốc Độ Vượt Trội với Biome
Thay thế ESLint + Prettier bằng **Biome**, tăng tốc độ phân tích cú pháp và định dạng mã nguồn gấp nhiều lần, đặc biệt hữu ích trong các CI/CD pipeline của monorepo quy mô lớn.

### 4. Tách Biệt Design System với Naive UI (`@repo/ui`)
`naive-ui` được cấu hình tập trung tại `@repo/ui` cùng với Theme Overrides của doanh nghiệp (`AppConfigProvider`). Cả `user-web` và `admin-web` chỉ cần import từ `@repo/ui`, giúp đảm bảo tính đồng nhất giao diện và tránh cài đặt trùng lặp.

### 5. Quản Lý Dữ Liệu Phản Ứng với TanStack Query (`@repo/api-client`)
Package `@repo/api-client` đóng gói `@tanstack/vue-query`, HTTP Client và các custom query hooks (`useProfileQuery`, `useAdminUsersQuery`, `useAdminMetricsQuery`). Điều này giúp tái sử dụng cache logic giữa các app FE mà **không làm phình bundle của Backend Lambda** (vì `@repo/shared` vẫn giữ nguyên là TypeScript thuần).
