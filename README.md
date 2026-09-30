# APP_STEM

Website bán linh kiện, board IoT, robot kit và thiết bị STEM. Ứng dụng gồm giao diện cửa hàng, trang quản trị và API Node.js kết nối MongoDB.

## Tính năng

- Xem, tìm kiếm, lọc và xem chi tiết sản phẩm.
- Thêm sản phẩm vào giỏ hàng và gửi yêu cầu báo giá.
- Sao chép liên kết sản phẩm để chia sẻ cho người khác.
- Chuyển đổi Tiếng Việt, English và 日本語.
- Hotline `tel:` và email `mailto:` có thể bấm trực tiếp.
- Tài khoản khách hàng, lịch sử đơn hàng và trang quản trị.

## Yêu cầu

- Node.js 18 trở lên.
- MongoDB Atlas hoặc MongoDB đang chạy cục bộ nếu cần dùng tài khoản/API.

## Cài đặt và chạy

```powershell
cd "C:\Users\ASUS\Downloads\APP_STEM"
npm install
Copy-Item .env.example .env
npm start
```

Mở website tại <http://localhost:3000>.

Trong file `.env`, cập nhật thông tin MongoDB:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=stem_iot
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
MAIL_FROM=your-email@example.com
```

SMTP là bắt buộc để gửi mã xác thực khi đăng ký và khi quên mật khẩu. Với Gmail, hãy dùng App Password thay cho mật khẩu tài khoản.

Khi phát triển, có thể dùng chế độ tự khởi động lại:

```powershell
npm run dev
```

## Cấu trúc chính

| Đường dẫn | Mô tả |
| --- | --- |
| `index.html` | Giao diện cửa hàng |
| `app.js` | Logic giao diện, giỏ hàng và ngôn ngữ |
| `store.js` | Dữ liệu và đồng bộ dữ liệu cửa hàng |
| `server.js` | Express server và API |
| `admin/` | Giao diện quản trị |
| `api/` | Các module API |
| `assets/` | Banner, tài liệu và mã QR |

## Cập nhật lên GitHub

Nếu dự án chưa có Git:

```powershell
cd "C:\Users\ASUS\Downloads\APP_STEM"
git init
git branch -M main
git remote add origin https://github.com/USERNAME/TEN-REPO.git
git add .
git commit -m "Initial source code"
git push -u origin main
```

Các lần cập nhật tiếp theo:

```powershell
git pull --rebase origin main
git add .
git commit -m "Mô tả ngắn thay đổi"
git push origin main
```

Không đưa file `.env` hoặc thông tin bí mật lên GitHub. File `.env` đã được khai báo trong `.gitignore`.

## Xử lý conflict

```powershell
git status
# Sửa các file bị conflict
git add <ten-file-da-sua>
git rebase --continue
git push origin main
```

Hủy rebase hiện tại:

```powershell
git rebase --abort
```
