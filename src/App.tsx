import { useMemo, useState, type FormEvent } from 'react'
import './App.css'

type Gender = 'male' | 'female' | 'other'
type RunningGoal = 'beginner' | 'daily' | 'long' | 'speed' | 'trail'

type RecommendationItem = {
  name: string
  reason: string
  bestFor: string
  note: string
}

type RecommendationResponse = {
  title: string
  summary: string
  sizingTip: string
  recommendations: RecommendationItem[]
  environment?: 'preview' | 'production'
  model?: string
}

const genderLabel: Record<Gender, string> = {
  male: '남성',
  female: '여성',
  other: '선택 안 함',
}

const goalLabel: Record<RunningGoal, string> = {
  beginner: '입문 / 가벼운 조깅',
  daily: '일상 러닝',
  long: '장거리 러닝',
  speed: '스피드 / 인터벌',
  trail: '트레일 / 비포장',
}

function App() {
  const [gender, setGender] = useState<Gender | ''>('')
  const [shoeSize, setShoeSize] = useState('')
  const [runningGoal, setRunningGoal] = useState<RunningGoal | ''>('')
  const [result, setResult] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canContinue = gender !== '' && shoeSize !== '' && runningGoal !== ''

  const summary = useMemo(() => {
    return {
      gender: gender ? genderLabel[gender] : '미선택',
      size: shoeSize ? `${shoeSize}mm` : '미입력',
      goal: runningGoal ? goalLabel[runningGoal] : '미선택',
    }
  }, [gender, runningGoal, shoeSize])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canContinue || loading) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender,
          shoeSize: Number(shoeSize),
          runningGoal,
        }),
      })

      const payload = (await response.json()) as
        | RecommendationResponse
        | { error?: string; details?: string }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            'API 경로를 찾지 못했습니다. 지금은 Vite 개발 서버를 보고 있는 상태입니다. `npm run build && npm run pages:dev`로 Cloudflare Pages preview를 띄워야 /api/recommend가 동작합니다.',
          )
        }

        throw new Error(
          'error' in payload && payload.error
            ? [payload.error, payload.details].filter(Boolean).join('\n\n')
            : '추천 결과를 받아오지 못했습니다.',
        )
      }

      if ('recommendations' in payload) {
        setResult(payload)
      }
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : '추천 요청 중 알 수 없는 오류가 발생했습니다.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">RUNORY</span>
          <h1>러닝화 추천을 시작할 정보를 입력하세요</h1>
          <p className="lead">
            성별, 발사이즈, 러닝 목적을 입력하면 Cloudflare Pages Functions가
            OpenAI API를 호출해 카드형 추천 결과를 보여줍니다.
          </p>
        </div>

        <div className="form-layout">
          <form className="input-panel" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">성별</span>
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value as Gender | '')}
              >
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">선택 안 함</option>
              </select>
            </label>

            <label className="field">
              <span className="field-label">발사이즈 (mm)</span>
              <input
                type="number"
                inputMode="numeric"
                min="200"
                max="320"
                step="1"
                placeholder="예: 270"
                value={shoeSize}
                onChange={(event) => setShoeSize(event.target.value)}
              />
              <span className="field-hint">정확한 추천을 위해 mm 단위로 입력하세요.</span>
            </label>

            <label className="field">
              <span className="field-label">러닝 목적</span>
              <select
                value={runningGoal}
                onChange={(event) =>
                  setRunningGoal(event.target.value as RunningGoal | '')
                }
              >
                <option value="">선택하세요</option>
                <option value="beginner">입문 / 가벼운 조깅</option>
                <option value="daily">일상 러닝</option>
                <option value="long">장거리 러닝</option>
                <option value="speed">스피드 / 인터벌</option>
                <option value="trail">트레일 / 비포장</option>
              </select>
            </label>

            <button className="submit-button" type="submit" disabled={!canContinue || loading}>
              {loading ? '추천 계산 중...' : '추천받기'}
            </button>

            {error ? (
              <div className="error-box" role="alert">
                <strong>추천 실패</strong>
                <p>{error}</p>
              </div>
            ) : null}
          </form>

          <aside className="summary-card" aria-label="입력값 요약">
            <div className="summary-header">
              <span>입력 요약</span>
              <span className={canContinue ? 'status ready' : 'status'}>
                {canContinue ? '입력 완료' : '입력 필요'}
              </span>
            </div>

            <dl className="summary-list">
              <div>
                <dt>성별</dt>
                <dd>{summary.gender}</dd>
              </div>
              <div>
                <dt>발사이즈</dt>
                <dd>{summary.size}</dd>
              </div>
              <div>
                <dt>러닝 목적</dt>
                <dd>{summary.goal}</dd>
              </div>
            </dl>

            <p className="summary-note">
              추천 결과는 OpenAI가 생성한 카드형 JSON으로 표시됩니다.
            </p>
          </aside>
        </div>

        <section className="results" aria-live="polite">
          <div className="results-head">
            <div>
              <span className="eyebrow">추천 결과</span>
              <h2>{loading ? '결과 생성 중' : result?.title ?? '모델이 생성한 후보'}</h2>
            </div>
            <div className="result-meta">
              {loading ? <span className="status preview">Loading</span> : null}
              {result?.environment ? (
                <span
                  className={`status ${
                    result.environment === 'preview' ? 'preview' : 'ready'
                  }`}
                >
                  {result.environment === 'preview' ? 'Preview' : 'Production'}
                </span>
              ) : null}
              {result?.model ? <span className="status">{result.model}</span> : null}
            </div>
          </div>

          {loading ? (
            <>
              <p className="results-tip">OpenAI가 러닝화 후보를 정리하는 중입니다.</p>
              <div className="recommendation-grid">
                {Array.from({ length: 3 }).map((_, index) => (
                  <article className="shoe-card skeleton" key={index}>
                    <span className="shoe-category shimmer" />
                    <div className="skeleton-line shimmer wide" />
                    <div className="skeleton-line shimmer" />
                    <div className="skeleton-line shimmer medium" />
                    <div className="skeleton-line shimmer small" />
                  </article>
                ))}
              </div>
            </>
          ) : result ? (
            <>
              <p className="results-tip">{result.summary}</p>
              <div className="results-note">{result.sizingTip}</div>

              <div className="recommendation-grid">
                {result.recommendations.map((item) => (
                  <article className="shoe-card" key={item.name}>
                    <span className="shoe-category">Candidate</span>
                    <h3>{item.name}</h3>
                    <p>{item.reason}</p>
                    <ul className="shoe-meta">
                      <li>
                        <strong>잘 맞는 사람</strong>
                        <span>{item.bestFor}</span>
                      </li>
                      <li>
                        <strong>주의점</strong>
                        <span>{item.note}</span>
                      </li>
                    </ul>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="results-empty">
              추천받기 버튼을 누르면 여기에 AI 추천 결과가 카드로 표시됩니다.
            </p>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
