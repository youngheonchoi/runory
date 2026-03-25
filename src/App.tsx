import { useMemo, useState, type FormEvent } from 'react'
import './App.css'

type Gender = 'male' | 'female' | 'other'
type RunningGoal = 'beginner' | 'daily' | 'long' | 'speed' | 'trail'
type NavSection = 'home' | 'race' | 'calculator' | 'recommend' | 'training'
type RaceCategory = '10k' | 'half' | 'full'

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

type TrainingPlanWeek = {
  week: string
  focus: string
  schedule: string
  note: string
}

type TrainingPlanResponse = {
  title: string
  summary: string
  caution: string
  weeks: TrainingPlanWeek[]
  environment?: 'preview' | 'production'
  model?: string
}

type RaceItem = {
  name: string
  date: string
  location: string
  category: string
  status: string
  note: string
}

const navigationItems: Array<{
  id: NavSection
  label: string
  shortLabel: string
}> = [
  { id: 'home', label: '홈', shortLabel: 'Home' },
  { id: 'race', label: '대회', shortLabel: 'Race' },
  { id: 'calculator', label: '계산기', shortLabel: 'Calc' },
  { id: 'recommend', label: '추천', shortLabel: 'Pick' },
  { id: 'training', label: '훈련', shortLabel: 'Train' },
]

const raceCities = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '수원',
  '춘천',
]

const raceThemes = [
  '나이트런',
  '오션런',
  '시티런',
  '리버런',
  '챌린지런',
]

const raceFilterCategories = ['10km', '하프', '풀']
const raceStatuses = ['접수중', '접수마감', '대회종료']
const raceNotes = [
  '도심 순환 코스로 첫 대회 참가자도 부담이 적음',
  '강변 중심 평지 코스로 기록 도전에 적합',
  '업다운이 섞인 코스로 지구력 훈련용으로 좋음',
  '야간 운영 구간이 포함되어 분위기가 선명함',
  '가족 참가 부문과 메인 레이스가 함께 운영됨',
]

const raceItems: RaceItem[] = Array.from({ length: 50 }, (_, index) => {
  const city = raceCities[index % raceCities.length]
  const theme = raceThemes[index % raceThemes.length]
  const category = raceFilterCategories[index % raceFilterCategories.length]
  const status = raceStatuses[index % raceStatuses.length]
  const note = raceNotes[index % raceNotes.length]
  const month = String((index % 10) + 3).padStart(2, '0')
  const day = String(((index * 3) % 27) + 1).padStart(2, '0')

  return {
    name: `${city} ${theme} ${index + 1}`,
    date: `2026-${month}-${day}`,
    location: city,
    category,
    status,
    note,
  }
})

function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('home')
  const [raceNameQuery, setRaceNameQuery] = useState('')
  const [raceCategoryFilter, setRaceCategoryFilter] = useState('')
  const [raceLocationFilter, setRaceLocationFilter] = useState('')
  const [raceStatusFilter, setRaceStatusFilter] = useState('')
  const [distance, setDistance] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [shoeSize, setShoeSize] = useState('')
  const [runningGoal, setRunningGoal] = useState<RunningGoal | ''>('')
  const [trainingGender, setTrainingGender] = useState<Gender | ''>('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [record10k, setRecord10k] = useState('')
  const [recordHalf, setRecordHalf] = useState('')
  const [recordFull, setRecordFull] = useState('')
  const [raceCategory, setRaceCategory] = useState<RaceCategory | ''>('')
  const [raceDate, setRaceDate] = useState('')
  const [goalRecord, setGoalRecord] = useState('')
  const [weeklyRuns, setWeeklyRuns] = useState('')
  const [longestDistance, setLongestDistance] = useState('')
  const [averageTrainingPace, setAverageTrainingPace] = useState('')
  const [result, setResult] = useState<RecommendationResponse | null>(null)
  const [trainingResult, setTrainingResult] = useState<TrainingPlanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [trainingLoading, setTrainingLoading] = useState(false)
  const [error, setError] = useState('')
  const [trainingError, setTrainingError] = useState('')

  const canContinue = gender !== '' && shoeSize !== '' && runningGoal !== ''

  const paceSummary = useMemo(() => {
    const distanceValue = Number(distance)
    const hourValue = Number(hours || 0)
    const minuteValue = Number(minutes || 0)
    const secondValue = Number(seconds || 0)
    const totalSeconds = hourValue * 3600 + minuteValue * 60 + secondValue

    if (distanceValue <= 0 || totalSeconds <= 0) {
      return null
    }

    const paceInSeconds = Math.round(totalSeconds / distanceValue)
    const paceMinutes = Math.floor(paceInSeconds / 60)
    const paceSeconds = paceInSeconds % 60
    const totalHours = Math.floor(totalSeconds / 3600)
    const remainingMinutes = Math.floor((totalSeconds % 3600) / 60)
    const remainingSeconds = totalSeconds % 60

    return {
      distance: distanceValue.toFixed(distanceValue % 1 === 0 ? 0 : 2),
      totalTime:
        totalHours > 0
          ? `${totalHours}시간 ${remainingMinutes}분 ${remainingSeconds}초`
          : `${remainingMinutes}분 ${remainingSeconds}초`,
      pace: `${paceMinutes}' ${String(paceSeconds).padStart(2, '0')}" /km`,
    }
  }, [distance, hours, minutes, seconds])

  const canExtractTrainingPlan =
    trainingGender !== '' &&
    height !== '' &&
    weight !== '' &&
    raceCategory !== '' &&
    raceDate !== '' &&
    goalRecord !== '' &&
    weeklyRuns !== '' &&
    longestDistance !== '' &&
    averageTrainingPace !== ''

  const filteredRaces = useMemo(() => {
    return raceItems.filter((race) => {
      const matchName =
        raceNameQuery.trim() === '' ||
        race.name.toLowerCase().includes(raceNameQuery.trim().toLowerCase())
      const matchCategory =
        raceCategoryFilter === '' || race.category === raceCategoryFilter
      const matchLocation =
        raceLocationFilter === '' || race.location === raceLocationFilter
      const matchStatus = raceStatusFilter === '' || race.status === raceStatusFilter

      return matchName && matchCategory && matchLocation && matchStatus
    })
  }, [raceCategoryFilter, raceLocationFilter, raceNameQuery, raceStatusFilter])

  const handleResetRaceFilters = () => {
    setRaceNameQuery('')
    setRaceCategoryFilter('')
    setRaceLocationFilter('')
    setRaceStatusFilter('')
  }

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

  const handleTrainingSubmit = async () => {
    if (!canExtractTrainingPlan || trainingLoading) return

    setTrainingLoading(true)
    setTrainingError('')
    setTrainingResult(null)

    try {
      const response = await fetch('/api/training-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender: trainingGender,
          height: Number(height),
          weight: Number(weight),
          record10k,
          recordHalf,
          recordFull,
          raceCategory,
          raceDate,
          goalRecord,
          weeklyRuns: Number(weeklyRuns),
          longestDistance: Number(longestDistance),
          averageTrainingPace,
        }),
      })

      const payload = (await response.json()) as
        | TrainingPlanResponse
        | { error?: string; details?: string }

      if (!response.ok) {
        throw new Error(
          'error' in payload && payload.error
            ? [payload.error, payload.details].filter(Boolean).join('\n\n')
            : '훈련 계획표를 받아오지 못했습니다.',
        )
      }

      if ('weeks' in payload) {
        setTrainingResult(payload)
      }
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : '훈련 계획표 요청 중 알 수 없는 오류가 발생했습니다.'
      setTrainingError(message)
    } finally {
      setTrainingLoading(false)
    }
  }

  return (
    <main className="page">
      {activeSection === 'home' ? (
        <section className="hero-card home-card">
          <div className="home-mark">
            <span className="eyebrow">Running Info</span>
            <h1 className="home-title">RUNORY</h1>
          </div>
        </section>
      ) : null}

      {activeSection === 'recommend' ? (
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">pick</span>
            <h1>러닝화 추천을 위한 정보를 입력하세요</h1>
            <p className="lead">

            </p>
          </div>

          <div className="recommend-form-layout">
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

              <button
                className="submit-button"
                type="submit"
                disabled={!canContinue || loading}
              >
                {loading ? '추천 계산 중...' : '추천받기'}
              </button>

              {error ? (
                <div className="error-box" role="alert">
                  <strong>추천 실패</strong>
                  <p>{error}</p>
                </div>
              ) : null}
            </form>
          </div>

          <section className="results" aria-live="polite">
            <div className="results-head">
              <div>
                <h2>{loading ? '결과 생성 중' : result?.title ?? '추천 결과'}</h2>
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
                <p className="results-tip">러닝화 후보를 정리하는 중입니다.</p>
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
                추천받기 버튼을 누르면 여기에 AI 추천 결과가 표시됩니다.
              </p>
            )}
          </section>
        </section>
      ) : null}

      {activeSection === 'calculator' ? (
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">calc</span>
            <h1>페이스 계산기</h1>
            <p className="lead">
              거리와 기록을 입력하면 1km 기준 평균 페이스를 바로 계산합니다.
            </p>
          </div>

          <div className="calculator-layout">
            <section className="input-panel calculator-panel">
              <label className="field">
                <span className="field-label">거리 (km)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="예: 10"
                  value={distance}
                  onChange={(event) => setDistance(event.target.value)}
                />
              </label>

              <div className="field">
                <span className="field-label">기록</span>
                <div className="time-grid">
                  <label className="time-field">
                    <span>시간</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={hours}
                      onChange={(event) => setHours(event.target.value)}
                    />
                  </label>

                  <label className="time-field">
                    <span>분</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="59"
                      step="1"
                      placeholder="50"
                      value={minutes}
                      onChange={(event) => setMinutes(event.target.value)}
                    />
                  </label>

                  <label className="time-field">
                    <span>초</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="59"
                      step="1"
                      placeholder="00"
                      value={seconds}
                      onChange={(event) => setSeconds(event.target.value)}
                    />
                  </label>
                </div>
                <span className="field-hint">
                  예: 10km를 50분에 뛰었다면 `10`, `0`, `50`, `0`을 입력하세요.
                </span>
              </div>
            </section>

            <aside className="summary-card calculator-summary" aria-label="페이스 계산 결과">
              <div className="summary-header">
                <span>계산 결과</span>
                <span className={paceSummary ? 'status ready' : 'status'}>
                  {paceSummary ? '계산 완료' : '입력 대기'}
                </span>
              </div>

              <div className="pace-result">
                <span className="pace-caption">평균 페이스</span>
                <strong>{paceSummary?.pace ?? '--\' --" /km'}</strong>
              </div>

              <dl className="summary-list">
                <div>
                  <dt>거리</dt>
                  <dd>{paceSummary ? `${paceSummary.distance}km` : '미입력'}</dd>
                </div>
                <div>
                  <dt>기록</dt>
                  <dd>{paceSummary?.totalTime ?? '미입력'}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>
      ) : null}

      {activeSection === 'race' ? (
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">race</span>
            <h1>대회 찾기</h1>
            <p className="lead">

            </p>
          </div>

          <section className="input-panel race-search-panel" aria-label="대회 검색">
            <div className="summary-header">
              <span>검색</span>
              <div className="race-search-actions">
                {/* <span className="status">{filteredRaces.length}개 결과</span> */}
                <span className="status">0개 결과</span>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={handleResetRaceFilters}
                >
                  초기화
                </button>
              </div>
            </div>

            <div className="race-filter-grid">
              <label className="field race-name-field">
                <span className="field-label">대회명 검색</span>
                <input
                  type="text"
                  placeholder="예: 서울 나이트런"
                  value={raceNameQuery}
                  onChange={(event) => setRaceNameQuery(event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">종목</span>
                <select
                  value={raceCategoryFilter}
                  onChange={(event) => setRaceCategoryFilter(event.target.value)}
                >
                  <option value="">전체</option>
                  <option value="10km">10km</option>
                  <option value="하프">하프</option>
                  <option value="풀">풀</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">지역</span>
                <select
                  value={raceLocationFilter}
                  onChange={(event) => setRaceLocationFilter(event.target.value)}
                >
                  <option value="">전체</option>
                  {raceCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">상태</span>
                <select
                  value={raceStatusFilter}
                  onChange={(event) => setRaceStatusFilter(event.target.value)}
                >
                  <option value="">전체</option>
                  <option value="접수중">접수중</option>
                  <option value="접수마감">접수마감</option>
                  <option value="대회종료">대회종료</option>
                </select>
              </label>
            </div>
          </section>

          <section className="race-list-section" aria-label="대회 리스트">
            {filteredRaces.length < 0 ? (
              <div className="race-list">
                {filteredRaces.map((race) => (
                  <article className="race-card" key={`${race.name}-${race.date}`}>
                    <div className="race-card-head">
                      <div>
                        <span className="shoe-category">{race.category}</span>
                        <h3>{race.name}</h3>
                      </div>
                      <span
                        className={`status ${
                          race.status === '접수중'
                            ? 'ready'
                            : race.status === '대회종료'
                              ? 'race-ended'
                              : ''
                        }`}
                      >
                        {race.status}
                      </span>
                    </div>

                    <dl className="race-meta-list">
                      <div>
                        <dt>일정</dt>
                        <dd>{race.date}</dd>
                      </div>
                      <div>
                        <dt>지역</dt>
                        <dd>{race.location}</dd>
                      </div>
                    </dl>

                    <p>{race.note}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="results-empty">
                준비중...
              </p>
            )}
          </section>
        </section>
      ) : null}

      {activeSection === 'training' ? (
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">train</span>
            <h1>훈련 계획표 추출</h1>
            <p className="lead">

            </p>
          </div>

          <div className="recommend-form-layout">
            <section className="input-panel training-panel">
              <div className="summary-header">
                <span>정보 입력</span>
                <span className={canExtractTrainingPlan ? 'status ready' : 'status'}>
                  {canExtractTrainingPlan ? '추출 가능' : '입력 필요'}
                </span>
              </div>

              <div className="training-section-list">
                <section className="training-section">
                  <div className="training-section-head">
                    <h3>기본 정보</h3>
                    <p></p>
                  </div>
                  <div className="training-form-grid three-columns">
                    <label className="field">
                      <span className="field-label">성별</span>
                      <select
                        value={trainingGender}
                        onChange={(event) =>
                          setTrainingGender(event.target.value as Gender | '')
                        }
                      >
                        <option value="">선택하세요</option>
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                        <option value="other">선택 안 함</option>
                      </select>
                    </label>

                    <label className="field">
                      <span className="field-label">키 (cm)</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="100"
                        step="1"
                        placeholder="예: 175"
                        value={height}
                        onChange={(event) => setHeight(event.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">체중 (kg)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="30"
                        step="0.1"
                        placeholder="예: 68"
                        value={weight}
                        onChange={(event) => setWeight(event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="training-section">
                  <div className="training-section-head">
                    <h3>보유기록</h3>
                    <p></p>
                  </div>
                  <div className="training-form-grid three-columns">
                    <label className="field">
                      <span className="field-label">보유기록 10K</span>
                      <input
                        type="text"
                        placeholder="예: 45:30"
                        value={record10k}
                        onChange={(event) => setRecord10k(event.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">보유기록 하프</span>
                      <input
                        type="text"
                        placeholder="예: 1:45:00"
                        value={recordHalf}
                        onChange={(event) => setRecordHalf(event.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">보유기록 풀</span>
                      <input
                        type="text"
                        placeholder="예: 3:50:00"
                        value={recordFull}
                        onChange={(event) => setRecordFull(event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="training-section">
                  <div className="training-section-head">
                    <h3>출전 대회 정보</h3>
                    <p></p>
                  </div>
                  <div className="training-form-grid three-columns">
                    <label className="field">
                      <span className="field-label">출전 대회 종목</span>
                      <select
                        value={raceCategory}
                        onChange={(event) =>
                          setRaceCategory(event.target.value as RaceCategory | '')
                        }
                      >
                        <option value="">선택하세요</option>
                        <option value="10k">10K</option>
                        <option value="half">하프</option>
                        <option value="full">풀</option>
                      </select>
                    </label>

                    <label className="field">
                      <span className="field-label">대회일</span>
                      <input
                        type="date"
                        value={raceDate}
                        onChange={(event) => setRaceDate(event.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">목표기록</span>
                      <input
                        type="text"
                        placeholder="예: 3:30:00"
                        value={goalRecord}
                        onChange={(event) => setGoalRecord(event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="training-section">
                  <div className="training-section-head">
                    <h3>현재 훈련 상태</h3>
                    <p></p>
                  </div>
                  <div className="training-form-grid three-columns">
                    <label className="field">
                      <span className="field-label">현재 주간 러닝 횟수</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        placeholder="예: 4"
                        value={weeklyRuns}
                        onChange={(event) => setWeeklyRuns(event.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">1회 최장거리 (km)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.1"
                        placeholder="예: 18"
                        value={longestDistance}
                        onChange={(event) => setLongestDistance(event.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">평균 페이스</span>
                      <input
                        type="text"
                        placeholder="예: 5'30&quot;/km"
                        value={averageTrainingPace}
                        onChange={(event) => setAverageTrainingPace(event.target.value)}
                      />
                    </label>
                  </div>
                </section>
              </div>

              <button
                className="submit-button"
                type="button"
                disabled={!canExtractTrainingPlan || trainingLoading}
                onClick={handleTrainingSubmit}
              >
                {trainingLoading ? '훈련 계획표 생성 중...' : '훈련 계획표 추출'}
              </button>

              <p className="field-hint">
                보유기록은 아는 항목만 입력해도 되지만, 나머지 핵심 항목은 채워야 추출이 가능합니다.
              </p>

              {trainingError ? (
                <div className="error-box" role="alert">
                  <strong>계획표 생성 실패</strong>
                  <p>{trainingError}</p>
                </div>
              ) : null}
            </section>
          </div>

          <section className="results" aria-label="훈련 계획표 결과">
            <div className="results-head">
              <div>
                <h2>
                  {trainingLoading
                    ? '훈련 계획표 생성 중'
                    : trainingResult?.title ?? '훈련 계획표 결과'}
                </h2>
              </div>
              <div className="result-meta">
                {trainingLoading ? <span className="status preview">Loading</span> : null}
                {trainingResult?.environment ? (
                  <span
                    className={`status ${
                      trainingResult.environment === 'preview' ? 'preview' : 'ready'
                    }`}
                  >
                    {trainingResult.environment === 'preview' ? 'Preview' : 'Production'}
                  </span>
                ) : null}
                {trainingResult?.model ? (
                  <span className="status">{trainingResult.model}</span>
                ) : null}
              </div>
            </div>

            {trainingLoading ? (
              <>
                <p className="results-tip">훈련 강도와 주차 구성을 정리하는 중입니다.</p>
              </>
            ) : trainingResult ? (
              <>
                <p className="results-tip">{trainingResult.summary}</p>
                <div className="results-note">{trainingResult.caution}</div>
                <div className="training-table-wrap">
                  <table className="training-table">
                    <thead>
                      <tr>
                        <th>주차</th>
                        <th>핵심</th>
                        <th>구성</th>
                        <th>메모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingResult.weeks.map((row) => (
                        <tr key={row.week}>
                          <td>{row.week}</td>
                          <td>{row.focus}</td>
                          <td>{row.schedule}</td>
                          <td>{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="results-empty">
                훈련 조건을 입력하면 여기에 훈련 계획표 결과가 표시됩니다.
              </p>
            )}
          </section>
        </section>
      ) : null}

      {activeSection !== 'home' &&
      activeSection !== 'recommend' &&
      activeSection !== 'calculator' &&
      activeSection !== 'race' &&
      activeSection !== 'training' ? (
        <section className="hero-card placeholder-card">
          <div className="placeholder-copy">
            <span className="eyebrow">RUNORY</span>
            <h1>{navigationItems.find((item) => item.id === activeSection)?.label}</h1>
            <p>이 화면은 다음 단계에서 연결할 예정입니다.</p>
          </div>
        </section>
      ) : null}

      <div className="navigation-shell">
        <nav className="navigation" aria-label="네비게이션">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={
                activeSection === item.id ? 'navigation-item active' : 'navigation-item'
              }
              aria-current={activeSection === item.id ? 'page' : undefined}
              aria-label={item.label}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="navigation-icon" aria-hidden="true">
                {item.shortLabel}
              </span>
              <span className="navigation-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  )
}

export default App
