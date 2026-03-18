# Deploy API lên Railway

## Bước 1: Chuẩn bị MongoDB Atlas

1. Vào [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo cluster miễn phí
3. Database Access → Add User → tạo user + password
4. Network Access → Add IP → chọn **Allow Access from Anywhere** (0.0.0.0/0)
5. Lấy connection string: `mongodb+srv://user:pass@cluster.xxx.mongodb.net/crista-home`

## Bước 2: Deploy trên Railway

1. Vào [railway.app](https://railway.app) → đăng nhập (GitHub)
2. **New Project** → **Deploy from GitHub repo**
3. Chọn repo:
   - **crista-home** (monorepo) → sau khi chọn, vào **Settings** → **Root Directory** = `apps/api`
   - **crista-home-be** (nếu đã tách) → deploy trực tiếp
4. Railway sẽ tự build và deploy

## Bước 3: Cấu hình Environment Variables

Vào **Variables** → thêm:

| Biến | Giá trị |
|------|---------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.xxx.mongodb.net/crista-home` |
| `JWT_SECRET` | Chuỗi bí mật ngẫu nhiên (VD: `abc123xyz789`) |
| `API_URL` | URL Railway sau khi deploy (VD: `https://crista-home-api.up.railway.app`) |
| `CORS_ORIGINS` | `https://crista-home.vercel.app` (có thể thêm nhiều, cách nhau dấu phẩy) |

**Lưu ý:** `API_URL` cần set **sau** khi deploy xong (copy URL từ Railway).

## Bước 4: Lấy URL và cập nhật

1. Deploy xong → **Settings** → **Networking** → **Generate Domain** → copy URL
2. Thêm biến `API_URL` = URL vừa copy (VD: `https://crista-home-api-production.up.railway.app`)
3. Redeploy để áp dụng

## Bước 5: Cập nhật Vercel (Frontend)

1. Vercel → Project → **Settings** → **Environment Variables**
2. Thêm `NEXT_PUBLIC_API_URL` = URL API Railway (VD: `https://crista-home-api-production.up.railway.app`)
3. **Redeploy** frontend

## Lưu ý

- **Upload ảnh:** Railway dùng filesystem tạm, ảnh upload có thể mất khi restart. Cân nhắc dùng Cloudinary/S3 sau.
- **MongoDB Atlas:** Cần whitelist IP 0.0.0.0/0 để Railway kết nối được.
