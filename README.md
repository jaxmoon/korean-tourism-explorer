# Tourism Explorer

한국관광공사 Tour API와 Naver Maps를 활용한 관광지 탐색 서비스

## 주요 기능

- 🗺️ **인터랙티브 지도**: Naver Maps 기반 실시간 지도
- 🔍 **관광지 검색**: 키워드로 전국 관광지 검색
- 📱 **반응형 디자인**: 모바일/데스크톱 최적화
- 🎯 **위치 정보**: 관광지 상세 정보 및 위치 표시
- 📍 **마커 클러스터링**: 많은 마커를 효율적으로 표시

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Naver Maps API
- **Data**: 한국관광공사 Tour API
- **Testing**: Vitest, React Testing Library

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/public-api.git
cd public-api
```

### 2. 의존성 설치

```bash
npm install
```

### 3. API 키 설정

API 키를 발급받아야 합니다. 상세한 가이드는 다음 문서를 참고하세요:

**📖 [API 키 발급 가이드](./docs/API_KEY_GUIDE.md)**

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```bash
# Tour API Key
TOUR_API_KEY=your_tour_api_key_here

# Naver Map API Key
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id_here
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
public-api/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── tour/         # Tour API 프록시
│   ├── page.tsx          # 메인 페이지
│   └── globals.css       # 글로벌 스타일
├── components/            # React 컴포넌트
│   ├── map/              # 지도 관련 컴포넌트
│   │   ├── NaverMap.tsx
│   │   ├── MobileBottomSheet.tsx
│   │   └── ...
│   ├── search/           # 검색 컴포넌트
│   └── ui/               # UI 컴포넌트
├── lib/                   # 유틸리티 및 설정
│   ├── hooks/            # Custom Hooks
│   ├── models/           # 타입 정의
│   └── services/         # API 서비스
├── docs/                  # 문서
│   └── API_KEY_GUIDE.md  # API 키 발급 가이드
└── public/               # 정적 파일
```

## 사용 가능한 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage

# 린트 검사
npm run lint

# 타입 체크
npm run type-check
```

## 주요 컴포넌트

### NaverMap

Naver Maps SDK를 사용한 지도 컴포넌트

```tsx
<NaverMap
  locations={locations}
  center={{ lat: 37.5665, lng: 126.9780 }}
  zoom={12}
  onMarkerClick={handleMarkerClick}
  isLoading={isLoading}
/>
```

### MobileBottomSheet

모바일용 드래그 가능한 바텀시트

```tsx
<MobileBottomSheet
  locations={locations}
  activeLocationId={selectedLocationId}
  initialState="half"
  onLocationSelect={handleLocationSelect}
  isLoading={isLoading}
/>
```

### SearchBar

관광지 검색 컴포넌트

```tsx
<SearchBar onSearch={handleSearch} />
```

## API 엔드포인트

### `/api/tour/search`

관광지 키워드 검색

**Query Parameters:**
- `keyword`: 검색 키워드 (필수)
- `numOfRows`: 결과 개수 (기본: 10)
- `arrange`: 정렬 방식 (O: 제목순, R: 조회순)

**Example:**
```bash
GET /api/tour/search?keyword=서울&numOfRows=100&arrange=O
```

## 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `TOUR_API_KEY` | 한국관광공사 Tour API 키 | ✅ |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | Naver Maps Client ID | ✅ |

## 문제 해결

### API 키 오류

API 키가 작동하지 않는 경우 [API 키 발급 가이드](./docs/API_KEY_GUIDE.md)의 "문제 해결" 섹션을 참고하세요.

### 지도가 표시되지 않음

1. Naver Maps Client ID가 올바른지 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. 개발 서버 재시작

### 검색 결과가 없음

1. Tour API 키 승인 상태 확인
2. 일일 트래픽 제한 확인
3. 네트워크 연결 상태 확인

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Naver Maps API](https://www.ncloud.com/product/applicationService/maps)
- [한국관광공사 Tour API](https://api.visitkorea.or.kr)
- [공공데이터포털](https://www.data.go.kr)
