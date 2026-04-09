# Ticket System
<img width="862" height="473" alt="ticketsystem_image" src="https://github.com/user-attachments/assets/0fbad9a5-ef5f-4647-a6a5-0b885f61a286" />


*For English version, please scroll down.*

## 프로젝트 개요
고객 지원을 위한 최신형 티켓 시스템입니다. 이메일 초대 기반 회원가입, 실시간 채팅, 파일 첨부, 권한 관리, 이메일 알림 등 주요 기능을 제공합니다.

## 기술 스택
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.io
- **기타**: Docker, Nodemailer, MinIO(파일 첨부), ESLint/Prettier, Vitest/Jest

## 주요 기능
- 이메일 초대 기반 회원가입 및 비밀번호 재설정
- 유저 권한 관리(관리자/상담원/고객)
- 고객사 관리 시스템 (사용자별 고객사 할당, 상세정보 관리)
- 실시간 채팅 및 파일 첨부(채팅/티켓)
- 티켓 생성/업데이트 시 이메일 알림(첨부파일 포함)
- 고유 티켓 번호 자동 생성 (TKT-YYYYMMDD-0001 형식)
- 이메일 템플릿 관리 시스템 (관리자 전용)
- CC 이메일 기능 (티켓 생성 시 참조자 추가)

## 최근 업데이트 (2025년 7월)
### 주요 변경사항
1. **티켓 번호 자동 생성 시스템**
   - 형식: `TKT-YYYYMMDD-0001` (예: TKT-202412250001)
   - 일별 순차 번호 부여
   - 티켓 생성 시 자동으로 고유 번호 생성

2. **고객사 관리 시스템 개선**
   - 사용자별 고객사 할당 기능
   - 티켓 생성 시 고객사 선택/생성 가능
   - 관리자는 모든 고객사 조회, 일반 사용자는 자신의 고객사만 조회

3. **CC 이메일 기능**
   - 티켓 생성 시 참조자 이메일 추가 가능
   - JSON 배열 형태로 다중 이메일 지원
   - 이메일 알림 시 CC 수신자 포함

4. **이메일 템플릿 관리**
   - 관리자 전용 이메일 템플릿 관리 시스템
   - 초대 이메일 템플릿 커스터마이징 가능
   - 기본 템플릿 자동 생성 기능

5. **파일 업로드 시스템**
   - MinIO 기반 파일 저장소로 변경
   - 파일 크기 제한 및 타입 검증
   - 티켓별 파일 관리

6. **PostgreSQL 설정 최적화**
   - postgresql.conf 파일 추가로 DB 성능 최적화
   - Docker Compose에서 PostgreSQL 설정 적용

## 폴더 구조 및 주요 파일 설명
```
ticket-system/
├── backend/         # 백엔드 서버 소스코드 (Express, Prisma, Socket.io)
│   ├── Dockerfile           # 백엔드용 Docker 빌드 파일
│   ├── package.json         # 백엔드 의존성 및 스크립트
│   ├── tsconfig.json        # 백엔드 TypeScript 설정
│   ├── prisma/              # Prisma ORM 관련 파일
│   │   └── schema.prisma    # DB 모델 및 스키마 정의
│   └── src/                 # 백엔드 소스코드
│       ├── app.ts           # Express 서버 진입점, Socket.io, Prisma 클라이언트 초기화
│       ├── routes/          # API 라우트
│       │   ├── ticket.ts    # 티켓 관련 API (생성, 조회, 수정, 삭제)
│       │   ├── emailTemplate.ts # 이메일 템플릿 관리 API
│       │   └── ...
│       ├── services/        # 비즈니스 로직 서비스
│       ├── middlewares/     # 미들웨어 (인증 등)
│       └── utils/           # 유틸리티 함수
├── frontend/        # 프론트엔드 소스코드 (Next.js, React)
│   ├── Dockerfile           # 프론트엔드용 Docker 빌드 파일
│   ├── package.json         # 프론트엔드 의존성 및 스크립트
│   ├── tsconfig.json        # 프론트엔드 TypeScript 설정
│   └── pages/               # Next.js 페이지
│       └── index.tsx        # 메인 페이지 (환영 메시지)
├── docker-compose.yml # 전체 서비스(backend, frontend, db, minio) 통합 실행 환경
├── postgresql.conf   # PostgreSQL 성능 최적화 설정
└── README.md          # 프로젝트 설명 파일
```

### 각 폴더/파일 기능 요약
- **backend/**: 서버 API, 실시간 채팅, DB 연동, 인증, 파일 업로드 등 핵심 비즈니스 로직 구현
  - **Dockerfile**: 백엔드 컨테이너 빌드 설정
  - **package.json**: 서버 의존성 및 실행 스크립트
  - **tsconfig.json**: TypeScript 컴파일 설정
  - **prisma/schema.prisma**: User, Ticket, Comment, Message, File, Company, InviteEmailTemplate 등 DB 모델 정의
  - **src/app.ts**: Express 서버, Socket.io, Prisma 클라이언트 초기화 및 미들웨어 설정
  - **src/routes/ticket.ts**: 티켓 CRUD API, 파일 업로드, 이메일 알림, 고객사 관리
  - **src/routes/emailTemplate.ts**: 이메일 템플릿 관리 API (관리자 전용)
- **frontend/**: 사용자 UI, 티켓/채팅/로그인 등 페이지 및 컴포넌트 구현
  - **Dockerfile**: 프론트엔드 컨테이너 빌드 설정
  - **package.json**: 프론트엔드 의존성 및 실행 스크립트
  - **tsconfig.json**: TypeScript 컴파일 설정
  - **pages/index.tsx**: 메인(홈) 페이지
- **docker-compose.yml**: 전체 서비스(backend, frontend, db, minio) 통합 실행 환경 구성
- **postgresql.conf**: PostgreSQL 성능 최적화 설정 파일
- **README.md**: 프로젝트 설명 및 구조 안내

---

## 시작 방법
(각 폴더별 README 참고)

---

# Ticket System (English)

## Project Overview
A modern ticket system for customer support. Provides key features including email invitation-based registration, real-time chat, file attachments, permission management, and email notifications.

## Tech Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.io
- **Others**: Docker, Nodemailer, MinIO (file attachments), ESLint/Prettier, Vitest/Jest

## Key Features
- Email invitation-based registration and password reset
- User permission management (admin/agent/customer)
- Company management system (user-company assignment, detailed company info)
- Real-time chat and file attachments (chat/tickets)
- Email notifications on ticket creation/updates (with attachments)
- Automatic unique ticket number generation (TKT-YYYYMMDD-0001 format)
- Email template management system (admin only)
- CC email functionality (add recipients when creating tickets)

## Recent Updates (July 2025)
### Major Changes
1. **Automatic Ticket Number Generation System**
   - Format: `TKT-YYYYMMDD-0001` (e.g., TKT-202412250001)
   - Sequential numbering per day
   - Automatic unique number generation when creating tickets

2. **Enhanced Company Management System**
   - User-company assignment functionality
   - Company selection/creation when creating tickets
   - Admins can view all companies, regular users can only view their assigned company

3. **CC Email Functionality**
   - Add recipient emails when creating tickets
   - Support for multiple emails in JSON array format
   - Include CC recipients in email notifications

4. **Email Template Management**
   - Admin-only email template management system
   - Customizable invitation email templates
   - Automatic default template generation

5. **File Upload System**
   - Changed to MinIO-based file storage
   - File size limits and type validation
   - Per-ticket file management

6. **PostgreSQL Configuration Optimization**
   - Added postgresql.conf file for DB performance optimization
   - Applied PostgreSQL settings in Docker Compose

## Folder Structure and Key Files
```
ticket-system/
├── backend/         # Backend server source code (Express, Prisma, Socket.io)
│   ├── Dockerfile           # Docker build file for backend
│   ├── package.json         # Backend dependencies and scripts
│   ├── tsconfig.json        # Backend TypeScript configuration
│   ├── prisma/              # Prisma ORM related files
│   │   └── schema.prisma    # DB models and schema definition
│   └── src/                 # Backend source code
│       ├── app.ts           # Express server entry point, Socket.io, Prisma client initialization
│       ├── routes/          # API routes
│       │   ├── ticket.ts    # Ticket-related APIs (CRUD, file upload, email notifications)
│       │   ├── emailTemplate.ts # Email template management APIs
│       │   └── ...
│       ├── services/        # Business logic services
│       ├── middlewares/     # Middlewares (authentication, etc.)
│       └── utils/           # Utility functions
├── frontend/        # Frontend source code (Next.js, React)
│   ├── Dockerfile           # Docker build file for frontend
│   ├── package.json         # Frontend dependencies and scripts
│   ├── tsconfig.json        # Frontend TypeScript configuration
│   └── pages/               # Next.js pages
│       └── index.tsx        # Main page (welcome message)
├── docker-compose.yml # Integrated execution environment for all services (backend, frontend, db, minio)
├── postgresql.conf   # PostgreSQL performance optimization settings
└── README.md          # Project description file
```

### Folder/File Function Summary
- **backend/**: Implements core business logic including server API, real-time chat, DB integration, authentication, file upload
  - **Dockerfile**: Backend container build configuration
  - **package.json**: Server dependencies and execution scripts
  - **tsconfig.json**: TypeScript compilation settings
  - **prisma/schema.prisma**: DB model definitions for User, Ticket, Comment, Message, File, Company, InviteEmailTemplate, etc.
  - **src/app.ts**: Express server, Socket.io, Prisma client initialization and middleware setup
  - **src/routes/ticket.ts**: Ticket CRUD APIs, file upload, email notifications, company management
  - **src/routes/emailTemplate.ts**: Email template management APIs (admin only)
- **frontend/**: Implements user UI, ticket/chat/login pages and components
  - **Dockerfile**: Frontend container build configuration
  - **package.json**: Frontend dependencies and execution scripts
  - **tsconfig.json**: TypeScript compilation settings
  - **pages/index.tsx**: Main (home) page
- **docker-compose.yml**: Integrated execution environment configuration for all services (backend, frontend, db, minio)
- **postgresql.conf**: PostgreSQL performance optimization settings file
- **README.md**: Project description and structure guide

---

## Getting Started
(Refer to README in each folder)
