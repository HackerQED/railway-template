# Storage Module

Cloudflare R2 文件存储，基于 `@aws-sdk/client-s3`。

## 用法

```typescript
import { uploadFile, deleteFile } from '@/storage';

// 上传
const { url, key } = await uploadFile(buffer, 'photo.jpg', 'image/jpeg', 'uploads');

// 删除
await deleteFile(key);
```

## 存储目录

- `uploads/` — 用户通过 API 上传的文件（`/api/agent/upload`）
- `generation/` — Worker 从上游转存的生成结果

## 环境变量

```
STORAGE_REGION=auto
STORAGE_ACCESS_KEY_ID=your-access-key
STORAGE_SECRET_ACCESS_KEY=your-secret-key
STORAGE_BUCKET_NAME=your-bucket-name
STORAGE_ENDPOINT=https://your-r2-endpoint.com
STORAGE_PUBLIC_URL=https://assets.example.com
```
