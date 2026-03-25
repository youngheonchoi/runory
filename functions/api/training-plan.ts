export interface Env {
  OPENAI_API_KEY: string
  OPENAI_MODEL?: string
  OPENAI_MODEL_PREVIEW?: string
  CF_PAGES_BRANCH?: string
}

type RequestBody = {
  gender?: 'male' | 'female' | 'other'
  height?: number
  weight?: number
  record10k?: string
  recordHalf?: string
  recordFull?: string
  raceCategory?: '10k' | 'half' | 'full'
  raceDate?: string
  goalRecord?: string
  weeklyRuns?: number
  longestDistance?: number
  averageTrainingPace?: string
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
}

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    caution: { type: 'string' },
    weeks: {
      type: 'array',
      minItems: 4,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          week: { type: 'string' },
          focus: { type: 'string' },
          schedule: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['week', 'focus', 'schedule', 'note'],
      },
    },
  },
  required: ['title', 'summary', 'caution', 'weeks'],
} as const

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...init?.headers,
    },
  })
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text
  }

  for (const item of payload?.output ?? []) {
    if (item?.type !== 'message' || !Array.isArray(item.content)) continue

    const text = item.content
      .map((part: any) => {
        if (typeof part?.text === 'string') return part.text
        if (typeof part?.content === 'string') return part.content
        return ''
      })
      .join('')

    if (text.trim()) return text
  }

  return ''
}

function parseStructuredJson(text: string) {
  const trimmed = text.trim()

  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1])
    } catch {
      // Continue to brace extraction below.
    }
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error('JSON 파싱 실패')
  }
}

function buildPrompt(input: Required<RequestBody>) {
  const genderText = {
    male: '남성',
    female: '여성',
    other: '성별 선택 안 함',
  }[input.gender]

  const raceCategoryText = {
    '10k': '10K',
    half: '하프',
    full: '풀',
  }[input.raceCategory]

  return [
    '너는 러닝 코치이자 훈련 계획 설계 전문가다.',
    '사용자 정보를 바탕으로 현실적인 주차별 훈련 계획표를 만든다.',
    '출력은 반드시 JSON만 허용하며, 아래 스키마를 정확히 따른다.',
    '',
    '규칙:',
    '- 무리한 고강도 계획을 피하고 점진적으로 구성한다.',
    '- 주간 러닝 횟수와 최장거리를 반영한다.',
    '- raceDate와 goalRecord를 고려해 훈련 방향을 제안한다.',
    '- weeks는 4주 이상 8주 이하로 구성한다.',
    '- schedule은 한 주의 핵심 훈련 구성을 한 문장으로 설명한다.',
    '- note는 회복, 강도 조절, 부상 예방 중 하나 이상을 반영한다.',
    '- summary는 전체 훈련 방향을 짧게 설명한다.',
    '- caution은 현재 정보만으로 한계가 있음을 짧게 안내한다.',
    '',
    `성별: ${genderText}`,
    `키: ${input.height}cm`,
    `체중: ${input.weight}kg`,
    `보유기록 10K: ${input.record10k || '없음'}`,
    `보유기록 하프: ${input.recordHalf || '없음'}`,
    `보유기록 풀: ${input.recordFull || '없음'}`,
    `출전 대회 종목: ${raceCategoryText}`,
    `대회일: ${input.raceDate}`,
    `목표기록: ${input.goalRecord}`,
    `주간 러닝 횟수: ${input.weeklyRuns}회`,
    `1회 최장거리: ${input.longestDistance}km`,
    `평균 페이스: ${input.averageTrainingPace}`,
  ].join('\n')
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.OPENAI_API_KEY) {
    return json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
  }

  let body: RequestBody

  try {
    body = (await request.json()) as RequestBody
  } catch {
    return json({ error: '요청 본문을 읽을 수 없습니다.' }, { status: 400 })
  }

  if (
    !body.gender ||
    !body.height ||
    !body.weight ||
    !body.raceCategory ||
    !body.raceDate ||
    !body.goalRecord ||
    !body.weeklyRuns ||
    !body.longestDistance ||
    !body.averageTrainingPace
  ) {
    return json(
      {
        error:
          'gender, height, weight, raceCategory, raceDate, goalRecord, weeklyRuns, longestDistance, averageTrainingPace를 모두 입력해야 합니다.',
      },
      { status: 400 },
    )
  }

  const environment =
    env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH !== 'main' ? 'preview' : 'production'
  const model =
    environment === 'preview'
      ? env.OPENAI_MODEL_PREVIEW ?? env.OPENAI_MODEL ?? 'gpt-5.4-mini'
      : env.OPENAI_MODEL ?? 'gpt-5.4-mini'

  const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'developer',
          content: [{ type: 'input_text', text: buildPrompt(body as Required<RequestBody>) }],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(body, null, 2),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'training_plan',
          schema: responseSchema,
          strict: true,
        },
        verbosity: 'medium',
      },
      reasoning: {
        effort: 'medium',
        summary: 'auto',
      },
      tools: [],
      store: true,
      max_output_tokens: 2500,
    }),
  })

  if (!openaiResponse.ok) {
    const details = await openaiResponse.text()
    return json(
      {
        error: 'OpenAI API 요청이 실패했습니다.',
        details,
      },
      { status: 502 },
    )
  }

  const payload = await openaiResponse.json()
  const text = extractOutputText(payload)

  if (!text) {
    return json(
      { error: '모델 응답에서 텍스트를 찾지 못했습니다.', environment, model },
      { status: 502 },
    )
  }

  try {
    const parsed = parseStructuredJson(text) as TrainingPlanResponse
    return json({
      ...parsed,
      environment,
      model,
    })
  } catch (error) {
    return json(
      {
        error: '모델 응답 JSON을 해석하지 못했습니다.',
        details: error instanceof Error ? error.message : 'unknown error',
        raw: text,
        environment,
        model,
      },
      { status: 502 },
    )
  }
}
