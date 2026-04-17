---
nav: AI
title: AI agent teams
order: 1
toc: content
description: tbd
keywords: [tbd]
---

## Prompt

Act as a researcher. Read the content from this link (---) and identify:

1. The primary research question or thesis.
2. The methodology or argument structure.
3. The main findings or results.
4. The implications and any limitations. Present this in a structured summary.

Trả lời bằng tiếng Việt

## How we built our multi-agent research system

> https://www.anthropic.com/engineering/multi-agent-research-system  
> Published Jun 13, 2025

---

### 1. Câu hỏi / Luận điểm trung tâm

Bài viết trình bày hành trình xây dựng tính năng Research của Claude — một hệ thống đa tác nhân (multi-agent) cho phép tìm kiếm trên web, Google Workspace và các tích hợp khác để giải quyết các nhiệm vụ phức tạp. Câu hỏi cốt lõi là: **Làm thế nào để thiết kế một hệ thống AI đa tác nhân hoạt động đáng tin cậy trong môi trường sản xuất thực tế, từ giai đoạn nguyên mẫu đến triển khai?**

---

### 2. Phương pháp & Cấu trúc lập luận

Bài viết được tổ chức theo lớp kỹ thuật, đi từ lý do chọn kiến trúc → thiết kế hệ thống → kỹ thuật prompt → đánh giá → thách thức vận hành:

**Kiến trúc orchestrator-worker:**
Hệ thống sử dụng mô hình lead agent – subagent, trong đó lead agent phân tích truy vấn, lập chiến lược và tạo ra các subagent chạy song song để khám phá các khía cạnh khác nhau đồng thời.

**Khác biệt so với RAG truyền thống:**
Thay vì RAG tĩnh (lấy các đoạn văn bản giống nhất với truy vấn đầu vào), kiến trúc này dùng tìm kiếm nhiều bước, tự động điều chỉnh theo phát hiện mới và phân tích kết quả để đưa ra câu trả lời chất lượng cao.

**8 nguyên tắc kỹ thuật prompt** được đúc kết từ thực tế, bao gồm: tư duy như agent, dạy orchestrator cách phân việc, cân bằng nỗ lực theo độ phức tạp, thiết kế công cụ rõ ràng, để agent tự cải thiện, tìm kiếm từ rộng đến hẹp, dẫn dắt quá trình suy nghĩ, và gọi công cụ song song.

---

### 3. Kết quả chính

**Hiệu suất vượt trội so với single-agent:**
Hệ thống đa tác nhân với Claude Opus 4 là lead agent và các subagent Claude Sonnet 4 vượt trội hơn Claude Opus 4 đơn lẻ tới **90,2%** trên bộ đánh giá nghiên cứu nội bộ.

**Token là yếu tố quyết định hiệu suất:**
Ba yếu tố giải thích 95% phương sai hiệu suất trong đánh giá BrowseComp: mức sử dụng token một mình giải thích tới **80%**, hai yếu tố còn lại là số lượng tool call và lựa chọn model.

**Tăng tốc đáng kể nhờ song song hóa:**
Việc giới thiệu hai loại song song hóa — lead agent tạo 3–5 subagent song song, và subagent dùng 3+ công cụ cùng lúc — giúp cắt giảm thời gian nghiên cứu tới **90%** với các truy vấn phức tạp.

**Agent tự cải thiện công cụ:**
Một agent chuyên kiểm tra công cụ, khi gặp MCP tool có lỗi, sẽ thử dùng và sau đó viết lại mô tả để tránh lỗi — quy trình này dẫn đến giảm **40% thời gian hoàn thành nhiệm vụ** cho các agent dùng mô tả mới.

---

### 4. Hàm ý & Hạn chế

**Hàm ý thực tiễn:**

- Multi-agent đặc biệt hiệu quả với các truy vấn breadth-first (theo chiều rộng) cần khám phá nhiều hướng độc lập đồng thời.
- Đánh giá nên tập trung vào end-state (kết quả cuối) thay vì từng bước, vì các agent có thể đi theo những con đường hợp lệ khác nhau để đạt cùng mục tiêu.
- Nên bắt đầu đánh giá ngay từ sớm với mẫu nhỏ (~20 truy vấn) thay vì chờ xây dựng bộ eval lớn hàng trăm test case.

**Hạn chế:**

- **Chi phí token cao:** Agent thường tiêu thụ khoảng 4× token so với chat thông thường, còn multi-agent system tiêu thụ khoảng **15× hơn chat**.
- **Không phù hợp mọi tác vụ:** Các domain yêu cầu tất cả agent dùng chung context, hoặc có nhiều dependency giữa các agent, không phù hợp với multi-agent hiện tại — ví dụ, hầu hết tác vụ coding có ít tác vụ thực sự song song hóa được.
- **Bottleneck đồng bộ:** Hiện tại lead agent thực thi subagent theo kiểu đồng bộ, phải chờ từng nhóm subagent hoàn thành trước khi tiến tiếp — điều này tạo ra nút thắt trong luồng thông tin.
- **Lỗi cộng dồn và phi tất định:** Các thay đổi nhỏ đối với lead agent có thể thay đổi hành vi subagent theo cách khó đoán, và một bước thất bại có thể khiến agent đi theo hướng hoàn toàn khác, dẫn đến kết quả bất ngờ.

---

**Tóm lại**, bài viết cung cấp một lộ trình kỹ thuật toàn diện, kết hợp giữa lý thuyết thiết kế hệ thống và bài học thực chiến, đặc biệt hữu ích cho các đội ngũ muốn xây dựng hệ thống agentic đáng tin cậy trong sản xuất thực tế.

## Anthropic Shows How to Scale Claude Code with Subagents and MCP

> https://winbuzzer.com/2026/03/24/anthropic-claude-code-subagent-mcp-advanced-patterns-xcxwbn/  
> Published Mar 24, 2026

---

### 1. Câu hỏi/Luận điểm chính

Bài viết không phải là nghiên cứu học thuật, mà là một bài phân tích kỹ thuật-thị trường. Luận điểm trung tâm là: Claude Code đang chuyển dịch từ công cụ hỗ trợ lập trình cá nhân sang hạ tầng cấp đội nhóm (team-level infrastructure), và Anthropic đang cố gắng lấp khoảng trống giữa người dùng cá nhân và doanh nghiệp thông qua các kỹ thuật nâng cao như subagent orchestration và tích hợp MCP.

---

### 2. Cấu trúc lập luận

Bài viết theo cấu trúc: **bối cảnh thị trường → kỹ thuật cốt lõi → hệ sinh thái MCP → dữ liệu tăng trưởng → thách thức còn tồn đọng**.

- Anthropic tổ chức [một buổi webinar vào ngày 24/3](https://www.anthropic.com/webinars/claude-code-advanced-patterns) ([direct link](https://anthropic.ondemand.goldcast.io/on-demand/f52c4cc3-7b23-4ab8-93f3-d202706dd62b?email=thinh.kieu@sioux.asia&first_name=Thinh&last_name=Kieu)) về các pattern nâng cao, nhắm đến các đội đã qua giai đoạn thiết lập ban đầu nhưng chưa tích hợp Claude Code vào quy trình làm việc hàng ngày.
- Phần kỹ thuật đề cập subagents, hooks, và MCP — ba lớp giúp Claude Code vận hành tự động ở quy mô lớn.

---

### 3. Kết quả/Phát hiện chính

**Về tăng trưởng thị trường:**
Claude Code tăng từ khoảng 100 triệu USD doanh thu định kỳ hàng năm vào cuối 2025 lên hơn 2,5 tỷ USD, trở thành sản phẩm tăng trưởng nhanh nhất của Anthropic. Trong khảo sát gần 1.000 lập trình viên, Claude Code đứng số 1 trong các công cụ AI coding sau 8 tháng ra mắt, vượt qua GitHub Copilot và Cursor.

**Về kỹ thuật subagent:**
Claude Code đi kèm khoảng 14 công cụ tích hợp sẵn, bao gồm thao tác file, lệnh shell, truy cập web và điều khiển luồng. Các loại subagent bao gồm Explore (tìm kiếm codebase chỉ đọc), Plan (lập kế hoạch dựa trên nghiên cứu) và agent đa năng cho các tác vụ phức tạp nhiều bước.

**Về MCP:**
Kể từ khi Anthropic giới thiệu MCP vào cuối 2024, giao thức này đã được Apple tích hợp trong Xcode 26.3 và OpenAI hỗ trợ trong ChatGPT, đưa MCP trở thành tiêu chuẩn thực tế cho kết nối công cụ AI đa nhà cung cấp.

**Về sentiment lập trình viên:**
Claude Code có tỷ lệ ủng hộ 46% trong giới lập trình viên, so với 19% của Cursor và 9% của GitHub Copilot.

---

### 4. Hàm ý và Giới hạn

**Hàm ý chiến lược:**
Khi lớp kết nối (MCP) được chia sẻ giữa các nhà cung cấp, điểm khác biệt cạnh tranh dịch chuyển lên phía trên — về chất lượng orchestration và trải nghiệm lập trình viên. Đây chính xác là những gì Anthropic đang nhấn mạnh.

**Giới hạn được nhận diện:**

- Claude Code hiện không có tính năng theo dõi chi phí native theo người dùng, đội nhóm hay dự án, khiến doanh nghiệp thiếu công cụ quản trị khi triển khai agent ở quy mô lớn.
- MCP vẫn thiếu lớp policy để quản lý phân quyền trong các chuỗi delegation phức tạp — một lỗ hổng ngày càng nghiêm trọng khi doanh nghiệp kết nối agent với hệ thống nội bộ nhạy cảm.
- Khoảng cách doanh nghiệp vẫn còn: các công ty nhỏ ưa Claude Code ở mức 75%, trong khi doanh nghiệp lớn vẫn mặc định chọn GitHub Copilot, phần lớn do quan hệ mua sắm và kênh bán hàng của Microsoft.

---

**Nhận xét tổng quan:** Bài viết có giá trị như một tổng hợp thực tiễn về định vị chiến lược của Claude Code, nhưng phần lớn dựa trên thông cáo từ Anthropic và dữ liệu thứ cấp, không phải nghiên cứu độc lập — cần đọc có chọn lọc.
