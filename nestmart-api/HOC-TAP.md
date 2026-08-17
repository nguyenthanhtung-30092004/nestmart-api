# NestMart API — Nhật ký kiến thức NestJS (Cơ bản → Nâng cao)

> Tài liệu tổng hợp lại toàn bộ kiến thức đã học được thông qua việc xây dựng dự án **NestMart API** — một API thương mại điện tử hoàn chỉnh với NestJS, Prisma, PostgreSQL, Redis, BullMQ.

---

## Mục lục

1. [Kiến trúc tổng quan dự án](#1-kiến-trúc-tổng-quan-dự-án)
2. [Module — đơn vị tổ chức code](#2-module--đơn-vị-tổ-chức-code)
3. [Controller & Routing](#3-controller--routing)
4. [Service & Dependency Injection](#4-service--dependency-injection)
5. [DTO & Validation Pipe](#5-dto--validation-pipe)
6. [Kết nối Database với Prisma](#6-kết-nối-database-với-prisma)
7. [Thiết kế quan hệ dữ liệu (Schema)](#7-thiết-kế-quan-hệ-dữ-liệu-schema)
8. [Xác thực (Authentication) với JWT](#8-xác-thực-authentication-với-jwt)
9. [Phân quyền (Authorization) với Guard tùy biến](#9-phân-quyền-authorization-với-guard-tùy-biến)
10. [Middleware](#10-middleware)
11. [Exception Filter — chuẩn hóa lỗi trả về](#11-exception-filter--chuẩn-hóa-lỗi-trả-về)
12. [Transaction — đảm bảo toàn vẹn dữ liệu](#12-transaction--đảm-bảo-toàn-vẹn-dữ-liệu)
13. [Cache với Redis](#13-cache-với-redis)
14. [Hàng đợi (Queue) với BullMQ](#14-hàng-đợi-queue-với-bullmq)
15. [Gửi email (Mailer)](#15-gửi-email-mailer)
16. [Upload File](#16-upload-file)
17. [Webhook & bảo mật chữ ký (HMAC)](#17-webhook--bảo-mật-chữ-ký-hmac)
18. [Phân trang, lọc, tìm kiếm](#18-phân-trang-lọc-tìm-kiếm)
19. [Swagger — tài liệu hóa API](#19-swagger--tài-liệu-hóa-api)
20. [Testing](#20-testing)
21. [Đóng gói & triển khai với Docker](#21-đóng-gói--triển-khai-với-docker)
22. [Những điểm cần cải thiện thêm](#22-những-điểm-cần-cải-thiện-thêm)

---

## 1. Kiến trúc tổng quan dự án

NestMart API là một backend thương mại điện tử gồm các domain:

- **Auth** — đăng ký, đăng nhập, refresh token, đăng xuất
- **Users** — quản lý người dùng
- **Categories** — danh mục sản phẩm
- **Products** — sản phẩm, tìm kiếm, lọc, upload ảnh
- **Cart** — giỏ hàng
- **Orders** — đặt hàng (transaction)
- **Payment** — webhook xác nhận thanh toán
- **Reviews** — đánh giá sản phẩm
- **Mail** — gửi email bất đồng bộ qua queue

Mỗi domain được tổ chức thành một **module NestJS** riêng biệt (`*.module.ts`), tuân theo kiến trúc phân lớp kinh điển:

```
Controller (nhận request) → Service (xử lý nghiệp vụ) → Prisma (truy vấn DB)
```

Đây chính là áp dụng thực tế của **Separation of Concerns**: Controller không bao giờ chứa logic nghiệp vụ, chỉ nhận input và trả output.

---

## 2. Module — đơn vị tổ chức code

Mỗi tính năng là một `@Module` độc lập, khai báo `controllers`, `providers`, `imports`, `exports`. Ví dụ [`auth.module.ts`](src/auth/auth.module.ts):

```ts
@Module({
  imports: [JwtModule.register({ global: true, secret: ..., signOptions: {...} })],
  controllers: [AuthController],
  providers: [AuthService, JWTStrategy],
})
export class AuthModule {}
```

Điểm học được:
- `imports`: nạp module khác cần dùng (VD: `JwtModule`, `BullModule.registerQueue`).
- `providers`: đăng ký các class có thể được **Dependency Injection**.
- `MailModule` dùng `@Global()` để không phải import lại `MailService` ở mọi nơi cần gửi mail.
- `AppModule` là module gốc, nơi "lắp ráp" toàn bộ hệ thống lại (xem [`app.module.ts`](src/app.module.ts)).

---

## 3. Controller & Routing

Controller dùng decorator để khai báo route (`@Controller('products')`, `@Get()`, `@Post()`, ...). Lấy dữ liệu từ request qua các decorator: `@Body()`, `@Query()`, `@Param()`, `@Headers()`, `@Req()`.

Ví dụ điển hình trong [`products.controller.ts`](src/products/products.controller.ts):

```ts
@Get()
getAllProducts(@Query() query: FilterProductDto) { ... }

@Post()
@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('ADMIN')
createProduct(@Body() body: CreateProductDto) { ... }
```

→ Học được cách **kết hợp nhiều Guard** (`AuthGuard('jwt')` xác thực + `RoleGuard` phân quyền) và cách gắn metadata bằng decorator tùy biến (`@Roles`).

---

## 4. Service & Dependency Injection

Service là nơi chứa logic nghiệp vụ, được inject vào Controller qua constructor (Nest tự động khởi tạo — **Inversion of Control**):

```ts
constructor(
  private readonly prisma: PrismaService,
  @InjectQueue('mail-queue') private mailQueue: Queue,
) {}
```

Học được:
- `private readonly` trong constructor TypeScript tự động tạo property — không cần khai báo field riêng.
- Có thể inject cả Provider tự định nghĩa (`PrismaService`) lẫn Provider từ package ngoài (`@InjectQueue`, `@Inject(CACHE_MANAGER)`).

---

## 5. DTO & Validation Pipe

DTO (Data Transfer Object) dùng `class-validator` + `class-transformer` để mô tả và validate dữ liệu đầu vào. Ví dụ [`register.dto.ts`](src/auth/dto/register.dto.ts):

```ts
export class RegisterDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}
```

Và ví dụ validate + transform kiểu dữ liệu query string trong [`filter-product.dto.ts`](src/products/dto/filter-product.dto.ts):

```ts
@IsOptional()
@Type(() => Number)   // ép kiểu string "2" -> number 2
@IsInt()
@Min(1)
page?: number = 1
```

Kích hoạt toàn cục trong [`main.ts`](src/main.ts):

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,             // tự loại field lạ không khai báo trong DTO
  forbidNonWhitelisted: true,  // báo lỗi nếu client cố tình gửi field lạ
}));
```

→ Đây là kiến thức quan trọng về **bảo mật đầu vào**: không bao giờ tin dữ liệu client gửi lên nếu chưa qua validate.

---

## 6. Kết nối Database với Prisma

Dự án dùng **Prisma ORM** với **PostgreSQL**, kết nối qua driver adapter thuần (`@prisma/adapter-pg` + `pg.Pool`) thay vì URL kết nối mặc định — đây là cách làm mới của Prisma 7 ([`prisma.service.ts`](src/prisma/prisma.service.ts)):

```ts
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
super({ adapter });
```

`PrismaService extends PrismaClient implements OnModuleInit` — tận dụng lifecycle hook của Nest để tự `$connect()` khi module khởi động.

Các thao tác Prisma đã dùng qua dự án:
- `findUnique`, `findMany`, `findFirst`, `create`, `update`, `delete`, `createMany`, `deleteMany`
- `upsert` (tạo giỏ hàng nếu chưa có, giữ nguyên nếu đã có) — xem [`cart.service.ts`](src/cart/cart.service.ts)
- `include` để join quan hệ (`include: { items: { include: { product: true } } }`)
- `aggregate` để tính `_avg`, `_count` (tính rating trung bình sản phẩm) — [`reviews.service.ts`](src/reviews/reviews.service.ts)
- `where` động, xây dựng có điều kiện bằng kiểu `Prisma.ProductWhereInput`
- **Prisma Migrate**: mỗi thay đổi schema tạo một file migration SQL trong [`prisma/migrations/`](prisma/migrations)

---

## 7. Thiết kế quan hệ dữ liệu (Schema)

Từ [`schema.prisma`](prisma/schema.prisma) học được cách mô hình hóa các loại quan hệ:

| Quan hệ | Ví dụ trong dự án |
|---|---|
| 1 - 1 | `User` ↔ `Cart` (`userId Int @unique`) |
| 1 - N | `Category` → `Product`, `Cart` → `CartItem`, `Order` → `OrderItem` |
| N - N (qua bảng trung gian) | `User` ↔ `Product` thông qua `Review` (bảng nối có thêm dữ liệu: `content`, `rating`) |

Bài học thiết kế quan trọng: **OrderItem "chụp ảnh" giá tại thời điểm mua** (`price Int` copy từ `product.price`), để nếu sau này sản phẩm đổi giá thì đơn hàng cũ vẫn giữ đúng giá lịch sử — một pattern chuẩn trong hệ thống thương mại điện tử.

---

## 8. Xác thực (Authentication) với JWT

Luồng đầy đủ trong [`auth.service.ts`](src/auth/auth.service.ts):

1. **Đăng ký**: băm mật khẩu bằng `bcrypt.hash(password, 10)` trước khi lưu DB — không bao giờ lưu plain-text password.
2. **Đăng nhập**: so sánh bằng `bcrypt.compare()`, tạo **access token** (15 phút) và **refresh token** (7 ngày) song song bằng `Promise.all`.
3. **Refresh token cũng được băm trước khi lưu DB** (`updateRefreshTokenInDb`) — kể cả nếu DB bị lộ, hacker cũng không lấy được refresh token gốc.
4. **Refresh Token Rotation**: mỗi lần gọi `/auth/refresh`, hệ thống cấp cặp token mới và ghi đè token cũ trong DB.
5. **Đăng xuất**: xóa refresh token trong DB (set `null`) — vô hiệu hóa phiên đăng nhập ở tầng server, không chỉ xóa token ở client.

**Passport Strategy** ([`jwt.strategy.ts`](src/auth/strategies/jwt.strategy.ts)) dạy Nest cách lấy & xác thực token:

```ts
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: process.env.JWT_SECRET,
});

validate(payload) {
  return { userId: payload.sub, email: payload.email, role: payload.role };
}
```

Giá trị `validate()` trả về sẽ tự động được Nest gắn vào `req.user` — dùng ở mọi route được bảo vệ bởi `@UseGuards(AuthGuard('jwt'))`.

---

## 9. Phân quyền (Authorization) với Guard tùy biến

Đây là một trong những phần nâng cao nhất của dự án — kết hợp `Reflector` (đọc metadata) với `CanActivate` (custom Guard):

**Bước 1 — decorator gắn "biển hiệu" quyền hạn** ([`role.decorator.ts`](src/auth/decorators/role.decorator.ts)):
```ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**Bước 2 — Guard đọc biển hiệu và so sánh với `req.user.role`** ([`role.guard.ts`](src/auth/guards/role.guard.ts)):
```ts
const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
  context.getHandler(),
  context.getClass(),
]);
if (!requiredRoles) return true;   // route không yêu cầu role -> cho qua
const hasRole = requiredRoles.includes(user.role);
if (!hasRole) throw new ForbiddenException(...);
```

Cách dùng: `@UseGuards(AuthGuard('jwt'), RoleGuard)` + `@Roles('ADMIN')` trên route — ví dụ API tạo sản phẩm hoặc upload ảnh chỉ ADMIN mới gọi được.

→ Đây chính là kỹ thuật **RBAC (Role-Based Access Control)** dựng thủ công bằng Nest Guard + Metadata Reflection, một pattern rất phổ biến trong các dự án thực tế.

---

## 10. Middleware

[`logger.middleware.ts`](src/common/middlewares/logger.middleware.ts) — ghi log mọi request đi qua hệ thống (method, URL, thời gian), đăng ký toàn cục trong `AppModule`:

```ts
configure(consumer: MiddlewareConsumer) {
  consumer.apply(LoggerMiddleware).forRoutes('*');
}
```

Học được: Middleware chạy **trước** khi request tới Guard/Controller, phù hợp cho logging, đo thời gian, hoặc xử lý sớm (khác với Guard vốn dùng để chặn truy cập).

---

## 11. Exception Filter — chuẩn hóa lỗi trả về

[`http-exception.filter.ts`](src/common/filters/http-exception.filter.ts) bắt mọi `HttpException` và trả về format JSON đồng nhất cho toàn bộ API:

```ts
{
  success: false,
  statusCode: 404,
  timestamp: "...",
  path: "/products/999",
  message: "Không tìm thấy sản phẩm..."
}
```

Đăng ký toàn cục: `app.useGlobalFilters(new HttpExceptionFilter())`. → Frontend chỉ cần xử lý **một format lỗi duy nhất** cho mọi API, thay vì mỗi endpoint trả lỗi một kiểu.

---

## 12. Transaction — đảm bảo toàn vẹn dữ liệu

Phần quan trọng nhất về **tính đúng đắn dữ liệu** nằm ở [`orders.service.ts`](src/orders/orders.service.ts), khi đặt hàng cần thực hiện **nhiều thao tác ghi liên quan tới nhau**:

```ts
const result = await this.prisma.$transaction(async (tx) => {
  const newOrder = await tx.order.create({ data: { userId, totalAmount } });
  await tx.orderItem.createMany({ data: orderItemsData });
  await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  return newOrder;
});
```

Nếu **bất kỳ bước nào lỗi**, toàn bộ transaction tự động rollback — không thể xảy ra tình trạng đơn hàng được tạo nhưng giỏ hàng chưa bị xóa, hay ngược lại. Đây là ứng dụng thực tế của tính chất **ACID (Atomicity)**.

---

## 13. Cache với Redis

[`products.service.ts`](src/products/products.service.ts) minh họa pattern **Cache-Aside** kinh điển:

```ts
const cacheKey = `products_all:${JSON.stringify({ page, limit, search, categoryId })}`;
const cached = await this.cacheManager.get(cacheKey);
if (cached) return cached;          // CACHE HIT

// ... query PostgreSQL (CACHE MISS) ...
await this.cacheManager.set(cacheKey, result, 60000); // TTL 60s
```

Và **invalidate cache** khi dữ liệu thay đổi (tạo sản phẩm mới → xóa cache cũ để tránh trả dữ liệu lỗi thời):
```ts
await this.cacheManager.del('product_all');
```

Cấu hình toàn cục trong `AppModule` bằng `CacheModule.registerAsync` + `cache-manager-redis-yet`. Bài học: cache key phải **phản ánh đúng tham số truy vấn** (page/limit/search/category), nếu không sẽ trả nhầm dữ liệu cache của query khác.

---

## 14. Hàng đợi (Queue) với BullMQ

Khi đặt hàng xong, thay vì gửi email **ngay lập tức** (làm chậm response), hệ thống **ném việc gửi mail vào hàng đợi** ([`orders.service.ts`](src/orders/orders.service.ts)):

```ts
await this.mailQueue.add('send-order-confirmation', {
  email: user.email, orderId: result.id, totalAmount: result.totalAmount,
});
```

Một **Worker riêng** ([`mail.processor.ts`](src/mail/mail.processor.ts)) lắng nghe và xử lý job bất đồng bộ, chạy nền, không chặn response API:

```ts
@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  async process(job: Job<any>) {
    if (job.name === 'send-order-confirmation') {
      await this.mailService.sendOrderConfirmation(...);
    }
  }
}
```

→ Đây là kiến thức nâng cao về **xử lý bất đồng bộ / background job**, giúp API phản hồi nhanh và tách biệt các tác vụ chậm (I/O, gửi mail, gọi service ngoài) ra khỏi luồng chính. BullMQ dùng Redis làm nơi lưu trữ hàng đợi.

---

## 15. Gửi email (Mailer)

[`mail.module.ts`](src/mail/mail.module.ts) cấu hình `@nestjs-modules/mailer` với SMTP test (Ethereal) và `MailModule` được đánh dấu `@Global()` để mọi module khác dùng `MailService` mà không cần import lại.

---

## 16. Upload File

[`products.controller.ts`](src/products/products.controller.ts) minh họa upload ảnh sản phẩm với `multer` qua `FileInterceptor`:

```ts
FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(new BadRequestException('Chỉ chấp nhận JPG, JPEG, PNG!'), false);
    }
    cb(null, true);
  },
})
```

Kết hợp thêm `ParseFilePipe` + `MaxFileSizeValidator` để giới hạn dung lượng (5MB). File tĩnh được serve qua `ServeStaticModule` với route `/uploads`.

Bài học bảo mật: luôn **đổi tên file** khi lưu (tránh trùng lặp / path traversal) và **giới hạn định dạng + kích thước** file trước khi chấp nhận upload.

---

## 17. Webhook & bảo mật chữ ký (HMAC)

[`payment.service.ts`](src/payment/payment.service.ts) là phần bảo mật nâng cao nhất: xác thực webhook đến từ đối tác thanh toán (mô phỏng Momo/VNPay) bằng **HMAC SHA256**:

```ts
const expectedSignature = crypto
  .createHmac('sha256', this.PAYMENT_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

if (expectedSignature !== receivedSignature) {
  throw new BadRequestException('Chữ ký không hợp lệ. Cảnh báo tấn công giả mạo!');
}
```

→ Vì endpoint webhook là **public** (không có JWT vì đối tác thanh toán không đăng nhập), phải verify bằng **chữ ký bí mật chia sẻ trước** (shared secret) để đảm bảo request thực sự đến từ nguồn tin cậy, chống giả mạo request cập nhật trạng thái đơn hàng.

---

## 18. Phân trang, lọc, tìm kiếm

[`products.service.ts`](src/products/products.service.ts):

```ts
const skip = (page - 1) * limit;
const where: Prisma.ProductWhereInput = {};
if (search) where.name = { contains: search, mode: 'insensitive' };
if (categoryId) where.categoryId = categoryId;

const [products, totalItem] = await Promise.all([
  this.prisma.product.findMany({ where, skip, take: limit, include: { category: true } }),
  this.prisma.product.count({ where }),
]);
```

Bài học: dùng `Promise.all` để **chạy song song** 2 câu query độc lập (lấy data + đếm tổng), thay vì `await` tuần tự — tối ưu hiệu năng đáng kể.

---

## 19. Swagger — tài liệu hóa API

Cấu hình trong [`main.ts`](src/main.ts):

```ts
const config = new DocumentBuilder()
  .setTitle('NestMart E-commerce API')
  .addBearerAuth()
  .build();
SwaggerModule.setup('api', app, document);
```

Và trang trí controller bằng `@ApiTags`, `@ApiOperation`, `@ApiHeader`, `@ApiBody` (xem [`payment.controller.ts`](src/payment/payment.controller.ts)) để sinh tài liệu tương tác tại `/api`.

---

## 20. Testing

Mỗi module đều có file `.spec.ts` song song (unit test cho service/controller) và [`test/app.e2e-spec.ts`](test/app.e2e-spec.ts) cho test end-to-end với `supertest`. Cấu hình Jest nằm trong `package.json` (rootDir `src`, transform qua `ts-jest`).

---

## 21. Đóng gói & triển khai với Docker

[`docker-compose.yml`](docker-compose.yml) dựng 3 service phối hợp với nhau:

- `postgres-db` — PostgreSQL 15
- `redis` — Redis (dùng chung cho cả Cache và BullMQ)
- `api` — build từ [`Dockerfile`](Dockerfile), phụ thuộc (`depends_on`) 2 service trên

[`Dockerfile`](Dockerfile) theo đúng quy trình chuẩn cho app NestJS + Prisma:
```
copy package.json → npm install → copy code → npx prisma generate → npm run build → CMD chạy dist/main
```

Bài học: `depends_on` chỉ đảm bảo **thứ tự khởi động container**, không đảm bảo Postgres/Redis đã sẵn sàng nhận kết nối — trong thực tế cần thêm cơ chế retry/healthcheck khi kết nối DB lúc container mới khởi động.

---

## 22. Những điểm cần cải thiện thêm

Ghi chú lại để học tiếp / refactor trong tương lai:

- **`users.service.ts`** hiện đang trả dữ liệu giả lập (mock array), chưa nối với Prisma thật — cần hoàn thiện CRUD user thực sự.
- **Refresh token endpoint** (`POST /auth/refresh`) đang nhận `userId` trực tiếp từ `@Body()` — nên lấy `userId` từ chính payload đã giải mã trong refresh token (qua một `RefreshTokenStrategy` riêng) thay vì tin tưởng client gửi lên, tránh nguy cơ giả mạo `userId`.
- **`RoleGuard`** dùng string `'roles'` viết tay khi gọi `getAllAndOverride` — nên tách thành hằng số `ROLES_KEY` dùng chung giữa decorator và guard để tránh gõ sai chuỗi.
- **Cache key cố định `'product_all'`** khi xóa cache trong `createProduct()` không khớp với cache key động `products_all:{...}` khi ghi — cần dùng cùng một quy tắc đặt tên hoặc dùng cache theo `namespace/tag` để invalidate chính xác toàn bộ các key liên quan.
- Có thể học thêm: rate limiting (`@nestjs/throttler`), health check (`@nestjs/terminus`), centralized logging (Winston/Pino), CI/CD, và versioning API.

---

*Tài liệu này được tạo dựa trên trạng thái thực tế của source code dự án `nestmart-api` tại thời điểm viết. Cập nhật lại khi có tính năng mới.*
