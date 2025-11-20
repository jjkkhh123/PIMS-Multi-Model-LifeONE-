# PIMS-Multi-Model-LifeONE  

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)  

## 한줄 소개  
“멀티모달 입력 기반 대화형 AI 파이프라인을 활용한 개인생활관리 앱”  

## 목차  
- [프로젝트 개요](#프로젝트-개요)  
- [주요 특징](#주요-특징)  
- [기술 스택](#기술-스택)  
- [시스템 아키텍처](#시스템-아키텍처)  
- [설치 및 실행](#설치-및-실행)  
- [사용 방법](#사용-방법)  
- [디렉토리 구조](#디렉토리-구조)  
- [기여](#기여)  
- [라이선스](#라이선스)  
- [연락처](#연락처)  

## 프로젝트 개요  
본 프로젝트는 서버리스 아키텍처에서 동작하며, 사용자의 텍스트·음성·이미지 입력을 기반으로 geminiService.ts 를 통해 AI 처리를 수행하고, 최종적으로 로컬 스토리지에 데이터를 저장하는 “대화형 AI 파이프라인”을 구현합니다.  
데이터는 전통적인 CRUD 방식이 아닌 Context 기반 프롬프트와 JSON 스키마를 통한 구조화 과정을 거칩니다.  

## 주요 특징  
- **백엔드리스(Backend-less)**: 별도의 서버 없이 브라우저 내에서 AI 처리 및 데이터 저장.  
- **멀티모달 입력 지원**: 텍스트, 음성(Web Speech API), 이미지(영수증·메모) 입력을 통한 자연스러운 사용자 경험.  
- **AI-기반 구조화**: geminiService.ts 가 사용자 입력과 Context 데이터를 조합하여 prompt 생성 → AI가 이미지 분석(Vision) 및 텍스트 이해 → 미리 정의된 JSON 스키마로 결과 반환.  
- **로컬 중심 데이터 저장**: 사용자 개인정보 및 상태 데이터는 브라우저 로컬에 저장되어 보안성이 높음.  
- **유연한 확장성**: 새로운 데이터 타입을 추가할 경우 스키마와 프롬프트만 수정하면 AI가 자동 처리.  

## 기술 스택  
- TypeScript  
- React  
- Vite  
- Web Speech API  
- AI 서비스 연동 (예: Gemini)  
- Local Storage  

## 시스템 아키텍처  
아래는 시스템의 3계층 (View Layer, Service Layer, Data Layer) 및 데이터 파이프라인 흐름을 나타낸 다이어그램입니다.

![시스템 아키텍처 다이어그램]("images/system_architecture.png")  

### 데이터 파이프라인 흐름  
1. **입력(Input)**: 사용자 → 텍스트 | 음성 | 이미지  
2. **AI 처리(Processing)**: geminiService.ts → 입력 + Context 데이터 → AI 분석 → 구조화된 JSON 반환  
3. **상태 업데이트(State Update)**: App.tsx → JSON 파싱 → React State 업데이트 → 중복검사 및 확인 Modal  
4. **영속성(Persistence)**: React State 변경 → 로컬 스토리지 동기화  

## 설치 및 실행  
먼저 설치해야할것 :**  Node.js
bash
# 종속성 설치  
```
npm install  
```
# .env.local 파일 생성 후  
```
GEMINI_API_KEY=your_api_key_here  
```
# 개발 서버 실행  
```
npm run dev  
```
## 사용 방법
1. 앱을 실행한 후 초기 설정 또는 로그인 과정을 진행합니다.
2. 사이드바에서 채팅 인터페이스, 캘린더, 비용 목록, 연락처 목록 등 원하는 메뉴로 이동합니다.
3. 텍스트 입력, 음성 입력(Web Speech API), 이미지 업로드(메모/영수증)를 통해 데이터를 입력합니다.
4. 입력된 데이터는 geminiService.ts에 의해 AI 처리되고, 구조화된 JSON 형태의 결과가 도출됩니다.
5. AI가 제안한 데이터가 정확한지 사용자 확인(Confirmation Modal)을 거칩니다.
6. 확인된 데이터는 React State를 통해 앱에 반영됩니다.
7. 상태 변경이 발생하면 자동으로 로컬 스토리지(Local Storage)에 저장됩니다.
8. 모든 데이터는 브라우저 내부에 저장되므로 별도의 서버 없이 사용할 수 있습니다.

## 디렉토리 구조
```
/components                # UI 컴포넌트
  ├─ Chat/                # 채팅 인터페이스
  ├─ Sidebar/             # 사이드 네비게이션
  ├─ CalendarView/        # 일정 화면
  ├─ Expenses/            # 지출 목록 화면
  └─ Contacts/            # 연락처 화면

/services
  └─ geminiService.ts     # AI 처리, JSON 스키마, 시스템 프롬프트

/hooks                    # LocalStorage Sync 등 커스텀 훅

/types                    # 공통 타입 정의

/assets                   # 이미지, 아이콘

/docs                     # 아키텍처 다이어그램 등 문서 자료

App.tsx                   # 중앙 제어(전역 상태·라우팅·모달 제어)
index.tsx                 # 애플리케이션 진입점
.env.local                # Gemini API Key
```

## 기여

1. 저장소를 Fork 합니다.

2. 새로운 브랜치를 생성합니다: git checkout -b feature/YourFeature

3. 변경 사항을 커밋합니다: git commit -m "Add some feature"

4. 브랜치를 Push 합니다: git push origin feature/YourFeature

5. Pull Request를 생성합니다.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 연락처 
해당 프로젝트는 팀 프로젝트 임을 알려드립니다.    
이진수 : jjkkhh456@naver.com   
김하은 : ha2un0908@naver.com   
김미소 : misosmile0306@naver.com   
김동선 : es4135@naver.com    
