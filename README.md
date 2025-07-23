# Ticket System

*For English version, please scroll down.*

## 프로젝트 개요
고객 지원을 위한 최신형 티켓 시스템입니다. 이메일 초대 기반 회원가입, 실시간 채팅, 파일 첨부, 권한 관리, 이메일 알림 등 주요 기능을 제공합니다.

## 기술 스택
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.io
- **기타**: Docker, Nodemailer, AWS S3(파일 첨부), ESLint/Prettier, Vitest/Jest

## 주요 기능
- 이메일 초대 기반 회원가입 및 비밀번호 재설정
- 유저 권한 관리(관리자/상담원/고객)
- 실시간 채팅 및 파일 첨부(채팅/티켓)
- 티켓 생성/업데이트 시 이메일 알림(첨부파일 포함)
- 고유 티켓 번호 자동 생성

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
│       └── app.ts           # Express 서버 진입점, Socket.io, Prisma 클라이언트 초기화
├── frontend/        # 프론트엔드 소스코드 (Next.js, React)
│   ├── Dockerfile           # 프론트엔드용 Docker 빌드 파일
│   ├── package.json         # 프론트엔드 의존성 및 스크립트
│   ├── tsconfig.json        # 프론트엔드 TypeScript 설정
│   └── pages/               # Next.js 페이지
│       └── index.tsx        # 메인 페이지 (환영 메시지)
├── docker-compose.yml # 전체 서비스(backend, frontend, db, minio) 통합 실행 환경
└── README.md          # 프로젝트 설명 파일
```

### 각 폴더/파일 기능 요약
- **backend/**: 서버 API, 실시간 채팅, DB 연동, 인증, 파일 업로드 등 핵심 비즈니스 로직 구현
  - **Dockerfile**: 백엔드 컨테이너 빌드 설정
  - **package.json**: 서버 의존성 및 실행 스크립트
  - **tsconfig.json**: TypeScript 컴파일 설정
  - **prisma/schema.prisma**: User, Ticket, Comment, Message, File 등 DB 모델 정의
  - **src/app.ts**: Express 서버, Socket.io, Prisma 클라이언트 초기화 및 미들웨어 설정
- **frontend/**: 사용자 UI, 티켓/채팅/로그인 등 페이지 및 컴포넌트 구현
  - **Dockerfile**: 프론트엔드 컨테이너 빌드 설정
  - **package.json**: 프론트엔드 의존성 및 실행 스크립트
  - **tsconfig.json**: TypeScript 컴파일 설정
  - **pages/index.tsx**: 메인(홈) 페이지
- **docker-compose.yml**: 전체 서비스(backend, frontend, db, minio) 통합 실행 환경 구성
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
- **Others**: Docker, Nodemailer, AWS S3 (file attachments), ESLint/Prettier, Vitest/Jest

## Key Features
- Email invitation-based registration and password reset
- User permission management (admin/agent/customer)
- Real-time chat and file attachments (chat/tickets)
- Email notifications on ticket creation/updates (with attachments)
- Automatic unique ticket number generation

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
│       └── app.ts           # Express server entry point, Socket.io, Prisma client initialization
├── frontend/        # Frontend source code (Next.js, React)
│   ├── Dockerfile           # Docker build file for frontend
│   ├── package.json         # Frontend dependencies and scripts
│   ├── tsconfig.json        # Frontend TypeScript configuration
│   └── pages/               # Next.js pages
│       └── index.tsx        # Main page (welcome message)
├── docker-compose.yml # Integrated execution environment for all services (backend, frontend, db, minio)
└── README.md          # Project description file
```

### Folder/File Function Summary
- **backend/**: Implements core business logic including server API, real-time chat, DB integration, authentication, file upload
  - **Dockerfile**: Backend container build configuration
  - **package.json**: Server dependencies and execution scripts
  - **tsconfig.json**: TypeScript compilation settings
  - **prisma/schema.prisma**: DB model definitions for User, Ticket, Comment, Message, File, etc.
  - **src/app.ts**: Express server, Socket.io, Prisma client initialization and middleware setup
- **frontend/**: Implements user UI, ticket/chat/login pages and components
  - **Dockerfile**: Frontend container build configuration
  - **package.json**: Frontend dependencies and execution scripts
  - **tsconfig.json**: TypeScript compilation settings
  - **pages/index.tsx**: Main (home) page
- **docker-compose.yml**: Integrated execution environment configuration for all services (backend, frontend, db, minio)
- **README.md**: Project description and structure guide

---

## Getting Started
(Refer to README in each folder)