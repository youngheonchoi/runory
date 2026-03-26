export interface Env {
  OPENWEATHER_API_KEY: string
}

type RequestBody = {
  cityName?: string
  lat?: number
  lon?: number
}

type OpenWeatherForecastItem = {
  dt: number
  main?: {
    temp?: number
    feels_like?: number
    humidity?: number
  }
  weather?: Array<{
    description?: string
    icon?: string
  }>
  wind?: {
    speed?: number
  }
  pop?: number
  dt_txt?: string
}

type OpenWeatherResponse = {
  list?: OpenWeatherForecastItem[]
  city?: {
    name?: string
    country?: string
  }
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...init?.headers,
    },
  })
}

function formatSlotLabel(timestamp: number) {
  const date = new Date(timestamp * 1000)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')

  return `${month}.${day} ${hour}:00`
}

function formatDayLabel(dateText: string) {
  const date = new Date(`${dateText}T00:00:00`)
  return `${date.getMonth() + 1}.${date.getDate()}`
}

function buildCaution(nextPop: number, windSpeed: number, temp: number) {
  if (nextPop >= 0.6) {
    return '강수확률이 높아 방수 외투나 실내 대체 훈련을 함께 고려하는 편이 좋습니다.'
  }

  if (windSpeed >= 6) {
    return '바람이 강한 편이라 체감 강도가 올라갈 수 있으니 왕복 코스나 방풍 장비를 고려하세요.'
  }

  if (temp >= 24) {
    return '기온이 높아질 수 있어 장거리 러닝보다는 짧은 러닝과 수분 보충 중심으로 접근하는 편이 좋습니다.'
  }

  if (temp <= 2) {
    return '기온이 낮아 근육이 굳기 쉬우니 출발 전 워밍업 시간을 충분히 확보하세요.'
  }

  return '현재 예보 기준으로는 가벼운 야외 러닝을 검토할 수 있지만 실제 출발 전 최신 예보를 다시 확인하세요.'
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.OPENWEATHER_API_KEY) {
    return json(
      { error: 'OPENWEATHER_API_KEY가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  let body: RequestBody

  try {
    body = (await request.json()) as RequestBody
  } catch {
    return json({ error: '요청 본문을 읽을 수 없습니다.' }, { status: 400 })
  }

  if (
    typeof body.lat !== 'number' ||
    Number.isNaN(body.lat) ||
    typeof body.lon !== 'number' ||
    Number.isNaN(body.lon)
  ) {
    return json({ error: 'lat, lon 값을 모두 입력해야 합니다.' }, { status: 400 })
  }

  const weatherResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${body.lat}&lon=${body.lon}&appid=${env.OPENWEATHER_API_KEY}&units=metric&lang=kr`,
  )

  if (!weatherResponse.ok) {
    const details = await weatherResponse.text()

    if (weatherResponse.status === 401) {
      return json(
        {
          error:
            'OpenWeather API 키가 유효하지 않습니다. 프로젝트 루트의 `.dev.vars`에서 `OPENWEATHER_API_KEY`를 올바른 키로 교체한 뒤 개발 서버를 다시 시작하세요.',
          details,
        },
        { status: 502 },
      )
    }

    return json(
      {
        error: 'OpenWeather API 요청이 실패했습니다.',
        details,
      },
      { status: 502 },
    )
  }

  const payload = (await weatherResponse.json()) as OpenWeatherResponse
  const forecast = payload.list ?? []

  if (forecast.length === 0) {
    return json({ error: '예보 데이터를 찾지 못했습니다.' }, { status: 502 })
  }

  const normalizedForecast = forecast.slice(0, 8).map((item) => ({
    timestamp: item.dt,
    timeLabel: formatSlotLabel(item.dt),
    temperature: item.main?.temp ?? 0,
    feelsLike: item.main?.feels_like ?? 0,
    humidity: item.main?.humidity ?? 0,
    windSpeed: item.wind?.speed ?? 0,
    pop: item.pop ?? 0,
    description: item.weather?.[0]?.description ?? '정보 없음',
    icon: item.weather?.[0]?.icon ?? '',
  }))

  const dayMap = new Map<
    string,
    {
      date: string
      label: string
      minTemp: number
      maxTemp: number
      popTotal: number
      count: number
      descriptions: Record<string, number>
    }
  >()

  for (const item of forecast) {
    const dateKey = item.dt_txt?.slice(0, 10)
    if (!dateKey) continue

    const temp = item.main?.temp ?? 0
    const description = item.weather?.[0]?.description ?? '정보 없음'
    const existing = dayMap.get(dateKey)

    if (existing) {
      existing.minTemp = Math.min(existing.minTemp, temp)
      existing.maxTemp = Math.max(existing.maxTemp, temp)
      existing.popTotal += item.pop ?? 0
      existing.count += 1
      existing.descriptions[description] = (existing.descriptions[description] ?? 0) + 1
      continue
    }

    dayMap.set(dateKey, {
      date: dateKey,
      label: formatDayLabel(dateKey),
      minTemp: temp,
      maxTemp: temp,
      popTotal: item.pop ?? 0,
      count: 1,
      descriptions: { [description]: 1 },
    })
  }

  const days = Array.from(dayMap.values())
    .slice(0, 5)
    .map((day) => {
      const topDescription =
        Object.entries(day.descriptions).sort((left, right) => right[1] - left[1])[0]?.[0] ??
        '정보 없음'

      return {
        date: day.date,
        label: day.label,
        minTemp: day.minTemp,
        maxTemp: day.maxTemp,
        avgPop: day.count > 0 ? day.popTotal / day.count : 0,
        topDescription,
      }
    })

  const bestWindow = [...normalizedForecast].sort((left, right) => {
    const leftScore =
      left.pop * 100 + left.windSpeed * 4 + Math.abs(left.temperature - 13)
    const rightScore =
      right.pop * 100 + right.windSpeed * 4 + Math.abs(right.temperature - 13)

    return leftScore - rightScore
  })[0]

  const nextSlot = normalizedForecast[0]

  return json({
    city: {
      name: body.cityName ?? payload.city?.name ?? '선택 도시',
      country: payload.city?.country ?? '',
    },
    summary: {
      nextSlot,
      bestWindow,
      caution: buildCaution(nextSlot.pop, nextSlot.windSpeed, nextSlot.temperature),
    },
    days,
    forecast: normalizedForecast,
  })
}
