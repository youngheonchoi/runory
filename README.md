# Runory

러닝화 추천 서비스를 위한 Vite + React + Cloudflare Pages Functions 프로젝트입니다.

## 실행

```bash
npm install
npm run dev
```

`npm run dev`는 UI만 띄우는 Vite 서버입니다.  
OpenAI 추천 API까지 같이 보려면 `npm run dev:pages`를 사용하세요.

## OpenAI 연동

환경 변수:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` - production용 모델
- `OPENAI_MODEL_PREVIEW` - preview 환경에서 사용할 모델

Cloudflare Pages에서 `CF_PAGES_BRANCH`가 `main`이 아니면 preview로 인식합니다.
이 경우 `OPENAI_MODEL_PREVIEW`가 있으면 우선 사용합니다.

로컬 preview용 비밀값은 프로젝트 루트의 `.dev.vars`에 넣습니다.  
예시는 [`.dev.vars.example`](/Users/okerry/Desktop/dev/project/runory/.dev.vars.example)를 참고하세요.

## Preview

Cloudflare Pages Functions까지 포함해서 확인하려면:

```bash
npm run build
npm run pages:dev
```

`pages:dev`는 `dist`를 기준으로 Pages Function을 함께 띄웁니다.
`dev:pages`는 빌드 후 preview 서버까지 한 번에 띄웁니다.

## Cloudflare Pages

- 빌드 명령: `npm run build`
- 출력 디렉터리: `dist`
- 배포 설정: [`wrangler.toml`](/Users/okerry/Desktop/dev/project/runory/wrangler.toml)
- Functions 경로: `functions/api/recommend.ts`
