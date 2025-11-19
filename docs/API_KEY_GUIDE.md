# 한국관광공사 Tour API 키 발급 가이드

## 1. 한국관광공사 Tour API 소개

이 프로젝트는 한국관광공사에서 제공하는 Tour API를 사용하여 전국의 관광지, 음식점, 숙박 정보 등을 제공합니다.

## 2. API 키 발급 절차

### Step 1: 공공데이터포털 회원가입

1. [공공데이터포털](https://www.data.go.kr) 접속
2. 우측 상단 **"회원가입"** 클릭
3. 회원가입 절차 진행 (이메일 인증 필요)

### Step 2: Tour API 신청

1. 공공데이터포털 로그인
2. 검색창에 **"한국관광공사"** 또는 **"Tour API"** 검색
3. 다음 API들을 각각 신청:
   - **한국관광공사_국문 관광정보 서비스_GW**
   - 또는 **Tour API 4.0**

4. 각 API 상세 페이지에서 **"활용신청"** 버튼 클릭
5. 신청 정보 입력:
   - 활용목적: 개인 프로젝트 / 학습용 등
   - 상세 활용내용: 관광지 정보 조회 및 지도 표시
   - 기타 필요 정보 입력

### Step 3: 승인 대기

- 신청 후 **즉시 승인** 또는 **1-2 영업일** 소요
- 승인 여부는 이메일로 통보
- 마이페이지 > 오픈API > 개발계정에서 확인 가능

### Step 4: API 키 확인

1. 마이페이지 접속
2. **"오픈API"** 메뉴 선택
3. **"개발계정"** 또는 **"인증키 발급현황"** 선택
4. 발급된 API 키 확인:
   - **일반 인증키(Encoding)**: URL 인코딩된 키
   - **일반 인증키(Decoding)**: 디코딩된 원본 키

## 3. 프로젝트 설정

### 환경 변수 설정

1. 프로젝트 루트에 `.env.local` 파일 생성
2. 다음 내용 추가:

```bash
# Tour API Key (Decoding 키 사용)
TOUR_API_KEY=your_api_key_here

# Naver Map API Key
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
```

3. `your_api_key_here`를 실제 발급받은 **Decoding 키**로 교체

### 주의사항

⚠️ **중요:**
- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 이미 포함됨)
- Decoding 키를 사용해야 합니다 (Encoding 키는 URL에 이미 인코딩된 상태)
- API 키는 노출되지 않도록 주의하세요

## 4. API 사용 제한

### 무료 계정 제한사항

- **일일 트래픽**: 1,000건 (기본)
- **초당 요청**: 제한 없음 (합리적 사용 권장)
- 추가 트래픽이 필요한 경우 공공데이터포털에 문의

### API 호출 예시

이 프로젝트에서는 다음 API를 주로 사용합니다:

1. **키워드 검색** (`/searchKeyword1`)
   - 관광지명, 지역명으로 검색
   - 예: "서울", "경복궁" 등

2. **지역 기반 검색** (`/areaBasedList1`)
   - 지역 코드로 관광지 목록 조회

3. **상세 정보 조회** (`/detailCommon1`)
   - 특정 관광지의 상세 정보

## 5. 테스트

API 키 설정 후 다음 명령어로 테스트:

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후:
1. 검색창에 "서울" 입력
2. 지도에 관광지 마커가 표시되는지 확인
3. 바텀시트에 장소 목록이 표시되는지 확인

## 6. 문제 해결

### API 키가 작동하지 않는 경우

1. **승인 상태 확인**
   - 마이페이지에서 API 승인 여부 확인
   - 승인 대기 중이면 완료될 때까지 대기

2. **키 형식 확인**
   - Decoding 키를 사용하고 있는지 확인
   - 키에 공백이나 특수문자가 잘못 포함되지 않았는지 확인

3. **환경 변수 확인**
   - `.env.local` 파일이 프로젝트 루트에 있는지 확인
   - 파일명이 정확한지 확인 (`.env`가 아닌 `.env.local`)
   - 개발 서버 재시작: `npm run dev`

4. **API 호출 로그 확인**
   - 브라우저 콘솔에서 에러 메시지 확인
   - 서버 터미널에서 API 응답 확인

### 일일 트래픽 초과

- 다음날 0시에 리셋됩니다
- 추가 트래픽이 필요한 경우:
  1. 공공데이터포털 마이페이지 접속
  2. 해당 API 상세보기
  3. "활용신청변경" 또는 고객센터 문의

## 7. 추가 리소스

- [공공데이터포털](https://www.data.go.kr)
- [한국관광공사 Tour API 문서](https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15101578)
- [Tour API 가이드](https://api.visitkorea.or.kr)

## 8. Naver Maps API 키도 필요합니다

이 프로젝트는 지도 표시를 위해 Naver Maps API도 사용합니다.

### Naver Cloud Platform 가입

1. [Naver Cloud Platform](https://www.ncloud.com) 접속
2. 회원가입 및 로그인
3. Console 접속

### Maps API 신청

1. **Services** > **Application Service** > **Maps** 선택
2. **Application 등록** 클릭
3. 애플리케이션 정보 입력:
   - Application 이름: tourism-explorer (또는 원하는 이름)
   - Service: Web Dynamic Map 선택
   - Web 서비스 URL: `http://localhost:3000` (개발용)

4. 등록 후 **Client ID** 발급
5. `.env.local`에 추가:

```bash
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_client_id
```

## 9. 일반적인 문제 및 해결방법

### 문제 1: API 호출 시 500 "unexpected errors" 에러

**이것은 가장 흔한 문제이며, API 키가 아직 승인되지 않았다는 의미입니다.**

다음과 같은 에러가 발생할 때:
```
Response Status: 500 Internal Server Error
Response Body: unexpected errors
```

**원인:**
- API 키 신청이 승인 대기 중
- 승인되지 않은 키로는 API 요청을 처리할 수 없음
- 포털 관리자의 수동 승인이 필요함

**해결방법:**
1. https://www.data.go.kr/ 접속
2. 로그인 후 마이페이지 → 오픈API → 개발계정
3. "한국관광공사_국문 관광정보 서비스_GW" 찾기
4. 상태 확인:
   - ❌ "승인대기" = 승인 대기 중
   - ✅ "활용승인" = 사용 가능
5. 승인은 보통 1-24시간 소요
6. 승인 완료 시 이메일 통보
7. 승인 후 5-10분 대기 후 재시도

**중요:** 반드시 **Decoding 키**를 사용해야 합니다:
- ❌ 잘못된 키: `key%2Fvalue%3D%3D` (Encoding 키)
- ✅ 올바른 키: `key/value==` (Decoding 키)

### 문제 2: JSON 응답으로 에러 코드를 반환하는 경우

**JSON 형태로 resultCode를 반환하는 경우:**
- `30` = SERVICE_KEY_IS_NOT_REGISTERED_ERROR (등록되지 않은 키)
- `33` = UNSIGNED_CALL_ERROR (활성화되지 않은 키)
- `20` = SERVICE_ACCESS_DENIED_ERROR (접근 거부)
- `10` = INVALID_REQUEST_PARAMETER_ERROR (필수 파라미터 누락)
- `22` = LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR (일일 트래픽 초과)

### 테스트 스크립트 사용하기

프로젝트에 API 키를 직접 테스트할 수 있는 스크립트가 포함되어 있습니다:

```bash
# API 키 테스트
node scripts/test-api-key.js
```

이 스크립트는:
- API 키의 승인 상태 확인
- 정확한 에러 메시지 표시
- 인코딩 문제 진단
- 문제 해결 가이드 제공

---

**마지막 업데이트**: 2025-11-10
