---
description: Analyze and fix patient form issue
---

User sẽ cung cấp mô tả issue bằng tiếng Trung hoặc tiếng Anh. Nhiệm vụ của bạn là:

- Analyze issue
- Làm sao để reproduce được - ví dụ chạy yarn dev:mock, vào http://localhost:8080/research/1/patients/1 (để mở patient form), rồi sao nữa? (vì giao diện chỉ toàn tiếng Trung, nên bước này giống như bạn đọc hiểu và chỉ lại users bằng tiếng Anh hoặc tiếng Việt vậy)
- Giúp tôi document lại những cái đã tìm được. (nhớ là ngôn ngữ chính của tôi là tiếng Việt, có thể dùng tiếng Anh để document, nhưng đừng dùng tiếng Trung)

Các files liên quan tới patient form:

- src\app\researchCenter\components\upsertPatient\UpsertPatient.tsx
- src\app\researchCenter\components\upsertPatient\hooks\useUpsertPatient.ts
- src\assets\schema.json
