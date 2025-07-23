# Ticket System 요구사항 및 구현 현황

*For English version, please scroll down.*

## 1. 주요 요구사항
- Next.js, Express, Prisma, PostgreSQL, MinIO, Socket.io, Tailwind 기반 고객 티켓 시스템
- **주요 기능**
  - 이메일 초대 기반 회원가입
  - 비밀번호 재설정
  - 유저 권한 관리(관리자/에이전트/고객)
  - 실시간 채팅
  - 파일 첨부
  - 이메일 알림
  - 고유 티켓 번호
- **관리자 전용**
  - 사용자 관리(목록, 초대, 권한 변경, 삭제)
  - 초대 메일 템플릿 관리

---

## 2. 구현 현황

### [O] 관리자/유저 관리
- [O] 관리자만 접근 가능한 사용자 목록/초대/삭제/권한변경
- [O] 초대/가입/삭제/권한변경 시 목록 자동 갱신 및 피드백
- [O] 초대만 된 유저와 가입 완료 유저를 Invite/User 테이블로 구분 및 통합 표시
- [O] 초대 삭제(Invite 테이블에서 삭제)
- [O] 초대 메일 템플릿 CRUD (InviteEmailTemplate)

### [O] 인증/초대/가입
- [O] 초대 메일 발송 및 토큰 기반 가입
- [O] 비밀번호 규칙 및 설정/재설정
- [O] accept-invite API 및 프론트엔드 페이지
- [O] 비밀번호 재설정(이메일 발송)

### [O] 실시간 채팅/파일 첨부
- [O] Socket.io 기반 실시간 채팅
- [O] 파일 첨부 및 MinIO 연동

### [O] 고유 티켓 번호/기본 티켓 기능
- [O] 티켓 생성/조회/상태 관리
- [O] 고유 티켓 번호 생성

### [O] 관리자 UX 개선
- [O] 성공/실패 메시지, 상태별 구분, 자동 갱신 등

---

## 3. 테스트 현황
- [O] 관리자 페이지에서 초대/가입/삭제/권한변경/초대메일 템플릿 관리 정상 동작
- [O] 초대/가입/삭제/상태관리 등 관리자 중심의 UX 정상 동작
- [O] 초대/가입/삭제 등 액션에 대해 자동 갱신 및 피드백 정상 동작
- [O] 초대 메일 템플릿이 없을 때 404, 잘못된 토큰/가입 시 400/500 등 예외 처리 확인
- [O] curl로 백엔드 API 직접 호출 시 정상 동작 확인
- [△] 프론트엔드에서 accept-invite(가입) 시 500 에러 → body 전달/파싱 문제 진단 및 수정 중
- [△] 일부 React minified error(418/423/425) → API 실패 시 방어 코드 추가 필요

---

## 4. 향후 할 일/개선 과제
- [ ] 프론트엔드 accept-invite 500 에러 완전 해결 (body 전달/파싱 문제 최종 점검)
- [ ] 프론트엔드에서 API 실패(undefined/null) 시 방어 코드 추가 및 UX 개선
- [ ] 관리자 계정 비밀번호 분실 시 재설정 UX 강화(이메일 발송 등)
- [ ] 테스트 자동화(e2e, 통합테스트 등) 및 문서화
- [ ] 실서비스 배포 환경에서의 보안/환경 변수 점검
- [ ] 기타 실무적 진단/운영 가이드 추가

---

## 5. 참고/특이사항
- 초대/가입/삭제/상태관리 등 관리자 중심의 핵심 기능과 UX는 대부분 구현 및 개선 완료
- Invite 테이블 도입으로 초대 상태 관리까지 완성
- 일부 API(body 파싱 등)와 프론트 방어 코드, 에러 UX 등은 추가 개선 필요 

---

## 6. 최근 추가/진행 중 이슈 및 개선 내역 (2024.07)

### [O] 도커/환경변수/네트워크 문제 해결
- 프론트엔드가 도커 네트워크 이름(backend)로 API 요청 시 브라우저에서 인식 불가 → .env, docker-compose에서 localhost로 지정
- .env 파일 위치/적용 문제, 컨테이너 재빌드, 환경변수 적용 순서 등 실무적 진단/조치

### [O] Prisma 마이그레이션/DB 스키마 변경
- id, ticketId, userId 등 타입 Int→String(uuid)로 변경, 외래키 타입 불일치 마이그레이션 에러 해결
- 기존 데이터가 남아있을 때 NOT NULL 컬럼 추가 시 SQL로 직접 컬럼 추가/업데이트/제약 적용
- ticketNo, extraEmails, url 등 컬럼 추가 및 마이그레이션 적용

### [O] 관리자/유저/티켓 데이터 문제
- User 테이블이 비어있거나, admin 계정 role이 CUSTOMER로 잘못 저장되어 관리자 메뉴가 안 보임 → SQL로 직접 admin 계정 생성/role 변경
- 티켓 생성 시 userId가 없는 경우 Foreign key constraint 에러 발생 → 유저 데이터 확인/생성

### [O] 티켓/상세/목록/상태/CC/고객사명 개선
- 티켓 상세/목록에서 ticketNo, status, company.name, ccEmails 등 명확히 표시
- ticketNo를 uuid 기반이 아닌 날짜+일련번호(TKT-YYYYMMDD-0001)로 생성/저장
- 티켓 상세에서 상태 변경 드롭다운/버튼, CC 표시/추가/저장 UI, 고객사명 클릭 시 이동, 상태 변경시 알림(Toast) 등 프론트엔드 UI 자동 개선
- CC 입력란 자동완성(dropdown, 기존 유저 이메일 추천) 기능 추가
- 상태 변경/내용 수정 시 관련자(티켓 owner, CC, 댓글/메시지 참여자 등)에게 알림 메일 발송, 메일 본문에 티켓 전체 내용, 상태 변경 내역, 댓글/메시지 히스토리 포함

### [O] 기타 실무적 진단/조치
- 컨테이너가 바로 죽는 경우, node dist/app.js가 listen하지 않거나, Prisma 마이그레이션/환경변수/빌드 문제
- 컨테이너 내부 진입(run --entrypoint sh), node dist/app.js 직접 실행, .env/환경변수/파일 존재 여부 확인
- 기존 티켓 데이터와 스키마 불일치로 인한 404/조회 불가, 외래키 제약으로 인한 삭제 불가 → 자식 테이블(Comment, Message, File 등) 먼저 삭제 후 Ticket 삭제

### [진행중] 남은/진행 중 이슈
- 티켓 상세 UI의 상태/고객사/CC를 왼쪽 사이드바로 분리하는 구조 개선(추가 요청 가능)
- 상태 변경/내용 수정 시 알림 메일, 히스토리 등 실무적 요구사항 반영
- 프론트엔드/백엔드 타입/필드 일치, Prisma Client 재생성, npm 패키지 타입 설치 등 반복적 개선
- 실시간 채팅, 파일 첨부, 이메일 알림 등 부가 기능 정상 동작 확인

---

# Ticket System Requirements and Implementation Status (English)

## 1. Main Requirements
- Customer ticket system based on Next.js, Express, Prisma, PostgreSQL, MinIO, Socket.io, Tailwind
- **Key Features**
  - Email invitation-based registration
  - Password reset
  - User permission management (admin/agent/customer)
  - Real-time chat
  - File attachments
  - Email notifications
  - Unique ticket numbers
- **Admin Only**
  - User management (list, invite, permission change, delete)
  - Invitation email template management

---

## 2. Implementation Status

### [O] Admin/User Management
- [O] User list/invite/delete/permission change accessible only to admins
- [O] Automatic list refresh and feedback on invite/signup/delete/permission change
- [O] Separate and integrated display of invited users and registered users via Invite/User tables
- [O] Invitation deletion (delete from Invite table)
- [O] Invitation email template CRUD (InviteEmailTemplate)

### [O] Authentication/Invitation/Registration
- [O] Invitation email sending and token-based registration
- [O] Password rules and setting/reset
- [O] accept-invite API and frontend page
- [O] Password reset (email sending)

### [O] Real-time Chat/File Attachments
- [O] Socket.io-based real-time chat
- [O] File attachments and MinIO integration

### [O] Unique Ticket Numbers/Basic Ticket Features
- [O] Ticket creation/inquiry/status management
- [O] Unique ticket number generation

### [O] Admin UX Improvements
- [O] Success/failure messages, status-based categorization, automatic refresh, etc.

---

## 3. Test Status
- [O] Normal operation of invite/signup/delete/permission change/invitation email template management on admin page
- [O] Normal operation of admin-centered UX for invite/signup/delete/status management
- [O] Normal operation of automatic refresh and feedback for actions like invite/signup/delete
- [O] Exception handling confirmed: 404 when no invitation email template, 400/500 for invalid tokens/signup
- [O] Normal operation confirmed when calling backend API directly with curl
- [△] 500 error during accept-invite (signup) from frontend → diagnosing and fixing body transmission/parsing issues
- [△] Some React minified errors (418/423/425) → need to add defensive code for API failures

---

## 4. Future Tasks/Improvement Issues
- [ ] Complete resolution of frontend accept-invite 500 error (final check of body transmission/parsing issues)
- [ ] Add defensive code and improve UX for API failures (undefined/null) in frontend
- [ ] Strengthen admin account password recovery UX (email sending, etc.)
- [ ] Test automation (e2e, integration tests, etc.) and documentation
- [ ] Security/environment variable checks in production deployment environment
- [ ] Additional practical diagnostics/operation guides

---

## 5. Notes/Special Considerations
- Most core admin-centered functions and UX for invite/signup/delete/status management are implemented and improved
- Invitation status management completed with introduction of Invite table
- Some APIs (body parsing, etc.) and frontend defensive code, error UX need additional improvements

---

## 6. Recent Additions/Ongoing Issues and Improvements (2024.07)

### [O] Docker/Environment Variables/Network Issues Resolved
- Frontend API requests using Docker network name (backend) not recognized by browser → specified as localhost in .env, docker-compose
- Practical diagnosis/action for .env file location/application issues, container rebuild, environment variable application order

### [O] Prisma Migration/DB Schema Changes
- Changed id, ticketId, userId types from Int→String(uuid), resolved foreign key type mismatch migration errors
- When existing data remains, directly added columns/updated/applied constraints with SQL for NOT NULL column additions
- Added ticketNo, extraEmails, url columns and applied migrations

### [O] Admin/User/Ticket Data Issues
- User table empty or admin account role incorrectly saved as CUSTOMER causing admin menu not to show → directly created admin account/changed role with SQL
- Foreign key constraint error when userId missing during ticket creation → checked/created user data

### [O] Ticket/Detail/List/Status/CC/Company Name Improvements
- Clear display of ticketNo, status, company.name, ccEmails in ticket detail/list
- Generate/save ticketNo as date+serial number (TKT-YYYYMMDD-0001) instead of uuid-based
- Frontend UI automatic improvements: status change dropdown/button, CC display/add/save UI, company name click navigation, status change notifications (Toast)
- Added CC input field autocomplete (dropdown, existing user email recommendations)
- Send notification emails to related parties (ticket owner, CC, comment/message participants) on status change/content modification, include full ticket content, status change history, comment/message history in email body

### [O] Other Practical Diagnostics/Actions
- When containers die immediately: node dist/app.js not listening, or Prisma migration/environment variable/build issues
- Container internal access (run --entrypoint sh), direct node dist/app.js execution, check .env/environment variables/file existence
- 404/inquiry impossible due to existing ticket data and schema mismatch, deletion impossible due to foreign key constraints → delete child tables (Comment, Message, File, etc.) first, then delete Ticket

### [In Progress] Remaining/Ongoing Issues
- Structural improvement to separate ticket detail UI status/company/CC to left sidebar (additional requests possible)
- Reflect practical requirements like notification emails and history for status changes/content modifications
- Repetitive improvements: frontend/backend type/field matching, Prisma Client regeneration, npm package type installation
- Confirm normal operation of additional features like real-time chat, file attachments, email notifications