export interface Env {
  OPENAI_API_KEY: string
  OPENAI_MODEL?: string
  OPENAI_MODEL_PREVIEW?: string
  CF_PAGES_BRANCH?: string
}

type RequestBody = {
  gender?: 'male' | 'female' | 'other'
  shoeSize?: number
  runningGoal?: 'beginner' | 'daily' | 'long' | 'speed' | 'trail'
}

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
}

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    sizingTip: { type: 'string' },
    recommendations: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          reason: { type: 'string' },
          bestFor: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['name', 'reason', 'bestFor', 'note'],
      },
    },
  },
  required: ['title', 'summary', 'sizingTip', 'recommendations'],
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
      const slice = trimmed.slice(start, end + 1)
      return JSON.parse(slice)
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

  const goalText = {
    beginner: '입문 / 가벼운 조깅',
    daily: '일상 러닝',
    long: '장거리 러닝',
    speed: '스피드 / 인터벌',
    trail: '트레일 / 비포장',
  }[input.runningGoal]

  return [
    '너는 러닝화 추천 전문가다.',
    '사용자에게 받은 정보는 성별, 발 사이즈, 러닝 목적뿐이다.',
    '정보가 제한적이므로 단정적으로 말하지 말고, 목적에 맞는 러닝화 후보 3개를 제안하라.',
    '출력은 반드시 JSON만 허용하며, 아래 스키마를 정확히 따르라.',
    '',
    '규칙:',
    '- 추천은 후보 중심으로 제시한다.',
    '- 추천 이유는 러닝 목적 기준으로 설명한다.',
    '- 발볼, 안정성, 쿠셔닝 취향, 예산 정보가 없어서 결과가 달라질 수 있음을 짧게 언급한다.',
    '- 각 추천은 성격이 조금씩 달라야 한다.',
    '- 허위 사실이나 불확실한 모델 정보는 만들지 않는다.',
    '- recommendations는 반드시 3개다.',
    '- bestFor는 어떤 유형의 러너에게 맞는지 한 문장으로 적는다.',
    '- note는 주의점 또는 보완 포인트를 한 문장으로 적는다.',
    '',
    `성별: ${genderText}`,
    `발 사이즈: ${input.shoeSize}`,
    `러닝 목적: ${goalText}`,
  ].join('\n')
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.OPENAI_API_KEY) {
    return json(
      { error: 'OPENAI_API_KEY가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  let body: RequestBody

  try {
    body = (await request.json()) as RequestBody
  } catch {
    return json({ error: '요청 본문을 읽을 수 없습니다.' }, { status: 400 })
  }

  if (!body.gender || !body.shoeSize || !body.runningGoal) {
    return json(
      { error: 'gender, shoeSize, runningGoal을 모두 입력해야 합니다.' },
      { status: 400 },
    )
  }

  const environment = env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH !== 'main'
    ? 'preview'
    : ''
  const model =
    environment === 'preview'
      ? env.OPENAI_MODEL_PREVIEW ?? env.OPENAI_MODEL ?? ''
      : env.OPENAI_MODEL ?? ''

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
          content: [
            {
              type: 'input_text',
              text: buildPrompt(body as Required<RequestBody>),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `성별: ${body.gender}\n발 사이즈: ${body.shoeSize}\n러닝 목적: ${body.runningGoal}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'shoe_recommendation',
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
      max_output_tokens: 2000,
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

  const refusal =
    payload?.output?.find?.((item: any) =>
      item?.content?.some?.((part: any) => typeof part?.refusal === 'string'),
    ) ?? null

  if (refusal) {
    const refusalText =
      refusal.content.find((part: any) => typeof part?.refusal === 'string')?.refusal ??
      '모델이 요청을 거부했습니다.'
    return json(
      {
        error: refusalText,
        environment,
        model,
      },
      { status: 422 },
    )
  }

  const text = extractOutputText(payload)

  if (!text) {
    return json({ error: 'OpenAI 응답에서 본문을 찾지 못했습니다.' }, { status: 502 })
  }

  try {
    const parsed = parseStructuredJson(text) as RecommendationResponse
    return json({ ...parsed, environment, model })
  } catch {
    return json(
      {
        error: 'OpenAI 응답 JSON 파싱에 실패했습니다.',
        details: text,
      },
      { status: 502 },
    )
  }
}
