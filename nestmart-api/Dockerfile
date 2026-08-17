# 1. Mượn một hệ điều hành Linux siêu nhẹ có sẵn Nodejs.20
FROM node:20-alpine

# 2. Tạo thư mục làm việc tên là /app trong cái hộp đó
WORKDIR /app

# 3. Copy file cấu hinhfh thư viện vào và cài đặt
COPY package*.json ./
RUN npm install

# 4. Copy toàn bộ code của em vào hộp
COPY . .

# 5. Sinh ra Prisma Client và Build code TypeScript sang JavaScript
RUN npx prisma generate
RUN npm run build

# 6. Mở cổng 3000 cho cái hộp
EXPOSE 3000

# 7. Lệnh khởi chạy server khi cái hộp được bật lên
CMD [ "npm", "dist/main" ]