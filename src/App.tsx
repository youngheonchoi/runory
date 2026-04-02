import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'

type Gender = 'male' | 'female' | 'other'
type RunningGoal = 'beginner' | 'daily' | 'long' | 'speed' | 'trail'
type TopLevelSection = 'home' | 'race' | 'tools' | 'gear' | 'injury'
type LeafPage =
  | 'race-schedule'
  | 'pace-calculator'
  | 'training-plan'
  | 'weather'
  | 'shoe-recommend'
  | 'injury-types'
  | 'injury-prevention'
  | 'injury-recovery'
  | 'injury-ai-diagnosis'
type AppPage = TopLevelSection | LeafPage
type RaceCategory = '10k' | 'half' | 'full'
type HiddenPage = 'site-info' | 'privacy-policy' | 'ad-policy' | 'contact' | null

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
  venue?: string | null
  course?: string | null
  organizer?: string | null
  phone?: string | null
  homepage?: string | null
  email?: string | null
  sourceId?: string | null
  sourceUrl?: string | null
}

type WeatherForecastItem = {
  timestamp: number
  timeLabel: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  pop: number
  description: string
  icon: string
}

type WeatherDaySummary = {
  date: string
  label: string
  minTemp: number
  maxTemp: number
  avgPop: number
  topDescription: string
}

type WeatherResponse = {
  city: {
    name: string
    country: string
  }
  summary: {
    nextSlot: WeatherForecastItem
    bestWindow: WeatherForecastItem
    caution: string
  }
  days: WeatherDaySummary[]
  forecast: WeatherForecastItem[]
}

type HubCard = {
  id: LeafPage
  title: string
  description: string
  badge: string
}

const navigationItems: Array<{
  id: TopLevelSection
  label: string
  shortLabel: string
}> = [
  { id: 'home', label: '메인', shortLabel: 'Main' },
  { id: 'race', label: '대회', shortLabel: 'Race' },
  { id: 'tools', label: '도구', shortLabel: 'Tools' },
  { id: 'gear', label: '장비', shortLabel: 'Gear' },
  { id: 'injury', label: '부상', shortLabel: 'Care' },
]

const hubPages: Record<
  Exclude<TopLevelSection, 'home'>,
  {
    eyebrow: string
    title: string
    lead: string
    cards: HubCard[]
  }
> = {
  race: {
    eyebrow: 'race hub',
    title: '대회 허브',
    lead: '참가 가능한 러닝 대회 일정을 모아보고, 조건별로 빠르게 비교할 수 있습니다.',
    cards: [
      {
        id: 'race-schedule',
        title: '대회일정',
        description: '대회명과 코스 기준으로 러닝 대회 일정을 탐색합니다.',
        badge: 'Schedule',
      },
    ],
  },
  tools: {
    eyebrow: 'running tools',
    title: '러닝도구 허브',
    lead: '페이스 확인부터 목표 대회 준비까지, 실전에 필요한 도구를 한 화면에서 고를 수 있습니다.',
    cards: [
      {
        id: 'pace-calculator',
        title: '페이스 계산기',
        description: '거리와 기록을 넣으면 1km 기준 평균 페이스를 바로 계산합니다.',
        badge: 'Calculator',
      },
      {
        id: 'training-plan',
        title: '훈련 계획표 추출',
        description: '기록과 목표 대회 정보를 바탕으로 주차별 훈련 계획표를 생성합니다.',
        badge: 'Planner',
      },
      {
        id: 'weather',
        title: '날씨',
        description: '러닝 전 확인이 필요한 날씨 정보를 연결할 수 있는 메뉴입니다.',
        badge: 'Weather',
      },
    ],
  },
  gear: {
    eyebrow: 'gear hub',
    title: '장비 허브',
    lead: '러닝 장비 선택이 필요한 순간에 맞춰 핵심 추천 도구로 바로 이동할 수 있습니다.',
    cards: [
      {
        id: 'shoe-recommend',
        title: '러닝화 추천',
        description: '성별, 발사이즈, 러닝 목적을 바탕으로 러닝화 후보를 정리합니다.',
        badge: 'Shoes',
      },
    ],
  },
  injury: {
    eyebrow: 'injury hub',
    title: '부상 허브',
    lead: '러닝 중 자주 접하는 부상 정보와 예방, 회복 팁을 빠르게 확인할 수 있습니다.',
    cards: [
      {
        id: 'injury-types',
        title: '부상종류',
        description: '러너에게 흔한 부상 유형과 특징을 간단히 정리합니다.',
        badge: 'Types',
      },
      {
        id: 'injury-prevention',
        title: '부상예방',
        description: '훈련 전후 습관과 장비 선택 관점에서 예방 포인트를 안내합니다.',
        badge: 'Prevent',
      },
      {
        id: 'injury-recovery',
        title: '회복',
        description: '통증 발생 후 회복 단계에서 점검할 기본 원칙을 정리합니다.',
        badge: 'Recover',
      },
      {
        id: 'injury-ai-diagnosis',
        title: 'AI진단',
        description: '러닝 중 통증 상황을 바탕으로 진단 보조 기능을 준비 중입니다.',
        badge: 'AI',
      },
    ],
  },
}

const leafPageMeta: Record<
  LeafPage,
  { parent: Exclude<TopLevelSection, 'home'>; parentLabel: string; label: string }
> = {
  'race-schedule': {
    parent: 'race',
    parentLabel: '대회',
    label: '대회일정',
  },
  'pace-calculator': {
    parent: 'tools',
    parentLabel: '러닝도구',
    label: '페이스 계산기',
  },
  'training-plan': {
    parent: 'tools',
    parentLabel: '러닝도구',
    label: '훈련 계획표 추출',
  },
  weather: {
    parent: 'tools',
    parentLabel: '러닝도구',
    label: '날씨',
  },
  'shoe-recommend': {
    parent: 'gear',
    parentLabel: '장비',
    label: '러닝화 추천',
  },
  'injury-types': {
    parent: 'injury',
    parentLabel: '부상',
    label: '부상종류',
  },
  'injury-prevention': {
    parent: 'injury',
    parentLabel: '부상',
    label: '부상예방',
  },
  'injury-recovery': {
    parent: 'injury',
    parentLabel: '부상',
    label: '회복',
  },
  'injury-ai-diagnosis': {
    parent: 'injury',
    parentLabel: '부상',
    label: 'AI진단',
  },
}

const injuryPageContent: Record<
  Extract<LeafPage, 'injury-types' | 'injury-prevention' | 'injury-recovery'>,
  {
    eyebrow: string
    title: string
    lead: string
    sections: Array<{ title: string; body: string }>
  }
> = {
  'injury-types': {
    eyebrow: 'injury types',
    title: '러닝 부상 종류',
    lead: '아래 내용은 임시 안내이며, 통증이 심하거나 오래가면 진료가 우선입니다.',
    sections: [
      {
        title: '무릎 통증',
        body:
          '러너스 니로 불리는 슬개대퇴 통증 증후군은 러닝 후 무릎 앞쪽이 뻐근하거나 계단에서 불편한 형태로 자주 나타납니다. 갑작스러운 거리 증가나 하체 근력 불균형이 원인이 될 수 있습니다.',
      },
      {
        title: '정강이 통증',
        body:
          '정강이 안쪽이 욱신거리는 신 스플린트는 초보 러너나 훈련량을 급하게 올린 경우 흔합니다. 딱딱한 노면, 부족한 회복, 닳은 신발이 겹치면 더 잘 생깁니다.',
      },
      {
        title: '아킬레스와 발바닥 통증',
        body:
          '아킬레스건 통증과 족저근막 자극은 종아리 뻣뻣함, 발뒤꿈치 통증과 함께 나타날 수 있습니다. 스피드 훈련이나 언덕 훈련이 많을 때 부담이 커지기 쉽습니다.',
      },
    ],
  },
  'injury-prevention': {
    eyebrow: 'injury prevention',
    title: '러닝 부상 예방',
    lead: '무리하지 않는 훈련 설계와 기본 습관만 정리해도 부상 확률을 꽤 낮출 수 있습니다.',
    sections: [
      {
        title: '훈련량은 천천히 올리기',
        body:
          '주간 거리와 강도를 한 번에 크게 올리지 말고 점진적으로 조정하는 편이 안전합니다. 특히 인터벌, 언덕, 장거리 훈련을 같은 주에 몰아넣으면 피로 누적이 빠릅니다.',
      },
      {
        title: '워밍업과 근력 보강',
        body:
          '러닝 전 가벼운 조깅과 관절 가동성 운동으로 몸을 풀고, 평소에는 둔근과 종아리, 햄스트링 보강을 해두는 것이 좋습니다. 자세가 무너질수록 특정 부위에 스트레스가 집중됩니다.',
      },
      {
        title: '신발과 회복 관리',
        body:
          '발에 맞지 않거나 마모된 신발은 반복 충격을 키울 수 있습니다. 수면, 수분, 휴식일 확보도 예방의 일부라서 훈련만큼 중요하게 봐야 합니다.',
      },
    ],
  },
  'injury-recovery': {
    eyebrow: 'recovery',
    title: '러닝 후 회복 가이드',
    lead: '통증이 생긴 뒤에는 참으면서 뛰는 것보다 강도를 낮추고 상태를 구분하는 판단이 먼저입니다.',
    sections: [
      {
        title: '통증이 있으면 강도 즉시 낮추기',
        body:
          '러닝 중 통증이 점점 선명해지면 그날 훈련은 줄이거나 중단하는 편이 낫습니다. 초기에 무리하면 가벼운 자극이 장기적인 부상으로 번질 수 있습니다.',
      },
      {
        title: '냉온 관리와 대체 운동',
        body:
          '염증감이 강한 초반에는 휴식과 냉찜질이 도움이 될 수 있고, 통증이 가라앉는 동안에는 자전거, 걷기, 가벼운 코어 운동처럼 부담이 적은 대체 운동을 고려할 수 있습니다.',
      },
      {
        title: '복귀는 단계적으로',
        body:
          '통증이 사라졌다고 바로 원래 훈련량으로 돌아가기보다 짧고 쉬운 러닝부터 다시 시작하는 편이 안전합니다. 붓기, 절뚝거림, 압통이 남아 있으면 전문 진료를 우선해야 합니다.',
      },
    ],
  },
}

const seoulWeatherCity = {
  id: 'seoul',
  name: '서울',
  lat: 37.5665,
  lon: 126.978,
}

const homeQuotes = [
  '오늘의 한 걸음이 내일의 변화를 만든다.',
  '천천히 달려도, 멈추지 않으면 앞으로 간다.',
  '러닝은 기록과의 싸움이 아니라, 어제의 나를 넘는 일이다.',
  '힘들다는 건, 내가 성장하고 있다는 신호다.',
  '한 바퀴 더 도는 사람이 결국 끝까지 간다.',
  '러닝은 몸으로 하는 명상이다.',
  '땀은 거짓말하지 않는다.',
  '달리는 동안, 마음도 함께 가벼워진다.',
  '완벽한 출발보다 중요한 건 꾸준한 발걸음이다.',
  '포기하고 싶은 순간이, 가장 강해지는 순간이다.',
  '느려도 괜찮다. 중요한 건 계속 뛰는 것이다.',
  '러닝은 목적지보다 과정이 더 많은 걸 가르쳐준다.',
]

const siteInfoSections = [
  {
    title: '서비스 소개',
    body:
      'RUNORY는 러너가 장비, 대회, 훈련 정보를 한 화면에서 정리할 수 있도록 설계한 러닝 정보 웹 서비스입니다. 추천 결과와 계획표는 참고용 정보이며 개인의 건강 상태와 훈련 이력에 따라 달라질 수 있습니다.',
  },
  {
    title: '광고 및 운영 원칙',
    body:
      '사이트는 러닝 관련 정보 탐색과 비교를 돕는 목적의 콘텐츠를 제공합니다. 광고가 게재되더라도 특정 상품이나 대회를 보장하거나 강제 추천하지 않으며, 실제 구매와 참가 전에는 반드시 공식 판매처와 주최 측 정보를 다시 확인해야 합니다.',
  },
  {
    title: '문의 및 정책',
    body:
      '오류 제보, 정보 수정 요청, 광고 관련 문의는 운영자 검토 후 반영합니다. 개인정보를 직접 수집하는 회원가입 기능은 없으며, 서비스 품질 향상을 위한 기본적인 웹 접근만 고려합니다.',
  },
]

const privacyPolicySections = [
  {
    title: '기본 원칙',
    body:
      'RUNORY는 회원가입 기능을 제공하지 않으며 이름, 전화번호, 주소와 같은 직접 식별 개인정보를 기본적으로 수집하지 않습니다. 서비스 이용 과정에서 브라우저가 자동 전송하는 최소한의 기술 정보는 호스팅, 보안, 성능 유지 목적에 한해 처리될 수 있습니다.',
  },
  {
    title: '쿠키 및 광고 관련 안내',
    body:
      'Google을 포함한 제3자 제공업체는 쿠키를 사용하여 사용자의 이전 방문 기록을 기반으로 광고를 제공할 수 있습니다. Google의 광고 쿠키를 통해 Google과 파트너는 이 사이트 및 인터넷상의 다른 사이트 방문 기록을 기반으로 광고를 게재할 수 있습니다.',
  },
  {
    title: '사용자 선택권',
    body:
      '사용자는 Google 광고 설정에서 개인 맞춤 광고를 관리할 수 있으며, 추가로 aboutads.info를 통해 일부 제3자 맞춤 광고를 거부할 수 있습니다. 사이트는 광고 정책과 개인정보 관련 안내가 변경될 경우 해당 페이지를 업데이트합니다.',
  },
]

const adPolicySections = [
  {
    title: '광고 운영 기준',
    body:
      '광고는 서비스 운영을 위한 수익 수단으로 사용되며, 특정 상품이나 대회를 보장하거나 순위를 대가로 조정하지 않습니다. 콘텐츠와 광고는 구분되어 제공됩니다.',
  },
  {
    title: '콘텐츠 품질 원칙',
    body:
      'RUNORY는 러닝화 추천, 대회 탐색, 훈련 계획, 러닝 계산기 등 실제 러닝 정보 탐색에 도움이 되는 기능성 콘텐츠를 제공합니다. 비어 있는 페이지나 단순 템플릿만으로 구성된 화면은 지양합니다.',
  },
  {
    title: '면책 안내',
    body:
      '추천 결과와 계획표는 참고용이며 건강 상태, 부상 이력, 대회 공식 규정, 재고 및 가격 변동에 따라 실제 판단이 달라질 수 있습니다. 구매와 참가 전에는 반드시 공식 정보 재확인이 필요합니다.',
  },
]

const contactSections = [
  {
    title: '문의 안내',
    body:
      '문의는 Formspree 폼으로 접수하며, 서비스 오류와 정보 수정 요청을 우선적으로 확인합니다.',
  },
  {
    title: '응답 범위',
    body:
      '러닝화 정보, 대회 정보, 훈련 계획 관련 오탈자나 잘못된 노출이 확인되면 우선적으로 수정합니다.',
  },
  {
    title: '운영 메모',
    body:
      '광고 심사, 정책 반영, 콘텐츠 보강에 따라 페이지 구성이 조정될 수 있습니다.',
  },
]

const contactFormAction = 'https://formspree.io/f/xqegllaj'

const hiddenPageContent: Record<
  Exclude<HiddenPage, null>,
  {
    eyebrow: string
    title: string
    lead: string
    sections: typeof siteInfoSections
  }
> = {
  'site-info': {
    eyebrow: 'site info',
    title: 'RUNORY 사이트 안내',
    lead:
      '서비스 목적, 운영 원칙, 광고 및 정책 관련 기본 정보를 정리한 안내 페이지입니다.',
    sections: siteInfoSections,
  },
  'privacy-policy': {
    eyebrow: 'privacy',
    title: '개인정보 및 쿠키 안내',
    lead:
      '광고 게재와 서비스 운영에 필요한 기본적인 개인정보 및 쿠키 처리 방침을 안내합니다.',
    sections: privacyPolicySections,
  },
  'ad-policy': {
    eyebrow: 'ad policy',
    title: '광고 및 콘텐츠 운영 원칙',
    lead:
      '광고와 콘텐츠를 어떤 기준으로 운영하는지, 사용자에게 어떤 정보를 제공하는지 설명합니다.',
    sections: adPolicySections,
  },
  contact: {
    eyebrow: 'contact',
    title: '문의 및 운영 안내',
    lead:
      '오류 제보, 운영 기준, 수정 요청 범위 등 서비스 문의와 관련된 기본 정보를 정리합니다.',
    sections: contactSections,
  },
}

const siteLinks: Array<{ id: Exclude<HiddenPage, null>; label: string }> = [
  { id: 'site-info', label: '사이트 안내' },
  { id: 'privacy-policy', label: '개인정보' },
  { id: 'ad-policy', label: '광고 정책' },
  { id: 'contact', label: '문의 안내' },
]

const appPageMeta: Record<AppPage, { title: string; description: string }> = {
  home: {
    title: 'RUNORY | 러닝 정보 허브',
    description:
      '러닝 날씨, 대회 일정, 페이스 계산기, 러닝화 추천, 훈련 계획표를 한곳에서 확인하는 러닝 정보 서비스입니다.',
  },
  race: {
    title: 'RUNORY | 대회 허브',
    description: '코스와 대회명 기준으로 러닝 대회 정보를 탐색하는 RUNORY 대회 허브입니다.',
  },
  tools: {
    title: 'RUNORY | 러닝 도구 허브',
    description:
      '페이스 계산기, 훈련 계획표, 날씨 확인 등 러너에게 필요한 실용 도구를 모았습니다.',
  },
  gear: {
    title: 'RUNORY | 장비 허브',
    description: '러닝화 추천을 포함한 러닝 장비 선택용 정보를 제공하는 RUNORY 장비 허브입니다.',
  },
  injury: {
    title: 'RUNORY | 부상 허브',
    description: '러닝 중 자주 접하는 부상 유형과 예방, 회복 정보를 정리한 RUNORY 부상 허브입니다.',
  },
  'race-schedule': {
    title: 'RUNORY | 대회 일정',
    description: '대회명과 코스 기준으로 러닝 대회 일정을 탐색할 수 있습니다.',
  },
  'pace-calculator': {
    title: 'RUNORY | 페이스 계산기',
    description: '거리와 기록을 입력해 1km 기준 평균 페이스를 계산하는 RUNORY 러닝 계산기입니다.',
  },
  'training-plan': {
    title: 'RUNORY | 훈련 계획표',
    description:
      '현재 기록과 목표 대회 정보를 바탕으로 주차별 러닝 훈련 계획표를 생성할 수 있습니다.',
  },
  weather: {
    title: 'RUNORY | 러닝 날씨',
    description: '서울 기준 5일 예보를 바탕으로 러닝 전 확인이 필요한 날씨 정보를 제공합니다.',
  },
  'shoe-recommend': {
    title: 'RUNORY | 러닝화 추천',
    description: '성별, 발사이즈, 러닝 목적을 바탕으로 러닝화 후보를 정리해 드립니다.',
  },
  'injury-types': {
    title: 'RUNORY | 러닝 부상 종류',
    description: '러너에게 흔한 부상 유형과 특징을 간단히 정리한 안내 페이지입니다.',
  },
  'injury-prevention': {
    title: 'RUNORY | 러닝 부상 예방',
    description: '훈련량, 워밍업, 장비, 회복 관점에서 러닝 부상 예방 포인트를 안내합니다.',
  },
  'injury-recovery': {
    title: 'RUNORY | 러닝 회복 가이드',
    description: '러닝 중 통증 발생 후 회복 단계에서 확인할 기본 원칙을 안내합니다.',
  },
  'injury-ai-diagnosis': {
    title: 'RUNORY | AI진단',
    description: '러닝 중 통증 상황을 바탕으로 준비 중인 AI 진단 보조 기능 페이지입니다.',
  },
}

const hiddenPageMeta: Record<
  Exclude<HiddenPage, null>,
  { title: string; description: string }
> = {
  'site-info': {
    title: 'RUNORY | 사이트 안내',
    description: '서비스 목적, 운영 원칙, 광고 및 정책 관련 기본 정보를 정리한 안내 페이지입니다.',
  },
  'privacy-policy': {
    title: 'RUNORY | 개인정보 및 쿠키 안내',
    description: '광고 게재와 서비스 운영에 필요한 개인정보 및 쿠키 처리 방침을 안내합니다.',
  },
  'ad-policy': {
    title: 'RUNORY | 광고 및 콘텐츠 운영 원칙',
    description: '광고와 콘텐츠를 어떤 기준으로 운영하는지 설명하는 RUNORY 광고 정책 페이지입니다.',
  },
  contact: {
    title: 'RUNORY | 문의 및 운영 안내',
    description: '오류 제보, 정책 문의, 정보 수정 요청 범위를 정리한 RUNORY 문의 안내 페이지입니다.',
  },
}

function getHiddenPageFromUrl(): HiddenPage {
  if (typeof window === 'undefined') return null

  const { hash, pathname } = window.location

  if (hash === '#/site-info' || hash === '#site-info') {
    return 'site-info'
  }

  if (hash === '#/privacy-policy' || hash === '#privacy-policy') {
    return 'privacy-policy'
  }

  if (hash === '#/ad-policy' || hash === '#ad-policy') {
    return 'ad-policy'
  }

  if (hash === '#/contact' || hash === '#contact') {
    return 'contact'
  }

  if (pathname === '/site-info') {
    return 'site-info'
  }

  if (pathname === '/privacy-policy') {
    return 'privacy-policy'
  }

  if (pathname === '/ad-policy') {
    return 'ad-policy'
  }

  if (pathname === '/contact') {
    return 'contact'
  }

  return null
}

function updateMetaTag(
  selector: string,
  attribute: 'content' | 'href',
  value: string,
) {
  if (typeof document === 'undefined') return

  const element = document.head.querySelector(selector)
  if (!element) return

  element.setAttribute(attribute, value)
}

function splitCourseLabels(
  course: string | null | undefined,
  fallback?: string,
): string[] {
  if (!course || course.trim() === '') {
    return fallback ? [fallback] : []
  }

  const labels: string[] = []
  let current = ''
  let depth = 0

  for (let index = 0; index < course.length; index += 1) {
    const char = course[index]

    if (char === '(') {
      depth += 1
      current += char
      continue
    }

    if (char === ')') {
      depth = Math.max(0, depth - 1)
      current += char
      continue
    }

    if (char === ',') {
      const previous = course[index - 1] ?? ''
      const next = course[index + 1] ?? ''
      const isNumericComma = /\d/.test(previous) && /\d/.test(next)

      if (depth === 0 && !isNumericComma) {
        const token = current.trim()
        if (token) {
          labels.push(token)
        }
        current = ''
        continue
      }
    }

    current += char
  }

  const lastToken = current.trim()
  if (lastToken) {
    labels.push(lastToken)
  }

  return labels.length > 0 ? labels : fallback ? [fallback] : []
}

function App() {
  const [activePage, setActivePage] = useState<AppPage>('home')
  const [hiddenPage, setHiddenPage] = useState<HiddenPage>(() => getHiddenPageFromUrl())
  const [raceItems, setRaceItems] = useState<RaceItem[]>([])
  const [raceLoading, setRaceLoading] = useState(false)
  const [raceError, setRaceError] = useState('')
  const [raceNameQuery, setRaceNameQuery] = useState('')
  const [raceCourseFilter, setRaceCourseFilter] = useState('')
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
  const [weatherResult, setWeatherResult] = useState<WeatherResponse | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')
  const [weatherAutoRequested, setWeatherAutoRequested] = useState(false)
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

  const raceCourseOptions = useMemo(() => {
    return Array.from(new Set(raceItems.flatMap((race) => splitCourseLabels(race.course)))).sort(
      (left, right) => left.localeCompare(right, 'ko'),
    )
  }, [raceItems])

  const filteredRaces = useMemo(() => {
    return raceItems.filter((race) => {
      const matchName =
        raceNameQuery.trim() === '' ||
        race.name.toLowerCase().includes(raceNameQuery.trim().toLowerCase())
      const matchCourse =
        raceCourseFilter === '' || splitCourseLabels(race.course).includes(raceCourseFilter)

      return matchName && matchCourse
    })
  }, [raceCourseFilter, raceItems, raceNameQuery])

  const homeQuote = useMemo(() => {
    return homeQuotes[Math.floor(Math.random() * homeQuotes.length)]
  }, [])

  const handleResetRaceFilters = () => {
    setRaceNameQuery('')
    setRaceCourseFilter('')
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

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setRaceLoading(true)
      setRaceError('')

      try {
        const response = await fetch('/marathon_schedule.json')

        if (!response.ok) {
          throw new Error('대회 JSON을 불러오지 못했습니다.')
        }

        const payload = (await response.json()) as RaceItem[]

        if (!cancelled) {
          setRaceItems(payload)
        }
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : '대회 데이터를 불러오는 중 알 수 없는 오류가 발생했습니다.'

        if (!cancelled) {
          setRaceError(message)
        }
      } finally {
        if (!cancelled) {
          setRaceLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (activePage !== 'weather' && activePage !== 'home') {
      setWeatherAutoRequested(false)
    }
  }, [activePage])

  useEffect(() => {
    if (
      (activePage !== 'weather' && activePage !== 'home') ||
      weatherResult ||
      weatherLoading ||
      weatherAutoRequested
    ) {
      return
    }

    setWeatherAutoRequested(true)

    void (async () => {
      setWeatherLoading(true)
      setWeatherError('')

      try {
        const response = await fetch('/api/weather', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cityName: seoulWeatherCity.name,
            lat: seoulWeatherCity.lat,
            lon: seoulWeatherCity.lon,
          }),
        })

        const payload = (await response.json()) as
          | WeatherResponse
          | { error?: string; details?: string }

        if (!response.ok) {
          throw new Error(
            'error' in payload && payload.error
              ? [payload.error, payload.details].filter(Boolean).join('\n\n')
              : '날씨 정보를 받아오지 못했습니다.',
          )
        }

        if ('forecast' in payload) {
          setWeatherResult(payload)
        }
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : '날씨 요청 중 알 수 없는 오류가 발생했습니다.'
        setWeatherError(message)
      } finally {
        setWeatherLoading(false)
      }
    })()
  }, [activePage, weatherAutoRequested, weatherLoading, weatherResult])

  useEffect(() => {
    const syncHiddenPage = () => {
      setHiddenPage(getHiddenPageFromUrl())
    }

    syncHiddenPage()
    window.addEventListener('hashchange', syncHiddenPage)
    window.addEventListener('popstate', syncHiddenPage)

    return () => {
      window.removeEventListener('hashchange', syncHiddenPage)
      window.removeEventListener('popstate', syncHiddenPage)
    }
  }, [])

  const activeTopLevel = useMemo<TopLevelSection>(() => {
    if (activePage in leafPageMeta) {
      return leafPageMeta[activePage as LeafPage].parent
    }

    return activePage as TopLevelSection
  }, [activePage])

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const meta = hiddenPage ? hiddenPageMeta[hiddenPage] : appPageMeta[activePage]
    const canonicalPath = hiddenPage ? `/${hiddenPage}` : '/'
    const canonicalUrl = new URL(canonicalPath, window.location.origin).toString()
    const pageTitle = meta.title

    document.title = pageTitle
    updateMetaTag('meta[name="description"]', 'content', meta.description)
    updateMetaTag('meta[property="og:title"]', 'content', pageTitle)
    updateMetaTag('meta[property="og:description"]', 'content', meta.description)
    updateMetaTag('meta[property="og:url"]', 'content', canonicalUrl)
    updateMetaTag('meta[name="twitter:title"]', 'content', pageTitle)
    updateMetaTag('meta[name="twitter:description"]', 'content', meta.description)
    updateMetaTag('link[rel="canonical"]', 'href', canonicalUrl)

    const schemaElement = document.getElementById('runory-structured-data')

    if (!schemaElement) return

    schemaElement.textContent = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'RUNORY',
        url: window.location.origin,
        inLanguage: 'ko-KR',
        description: meta.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${window.location.origin}/#/race-schedule`,
          'query-input': 'required name=running-query',
        },
      },
      null,
      2,
    )
  }, [activePage, hiddenPage])

  const handleNavigationSelect = (section: TopLevelSection) => {
    setActivePage(section)

    if (hiddenPage && typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/')
      setHiddenPage(null)
    }
  }

  const handleLeafNavigation = (page: LeafPage) => {
    setActivePage(page)
  }

  const handleHiddenPageOpen = (page: Exclude<HiddenPage, null>) => {
    if (typeof window === 'undefined') return

    window.history.replaceState(null, '', `/${page}`)
    setHiddenPage(page)
  }

  return (
    <main className="page">
      <header className="site-header" aria-label="공통 헤더">
        <div className="site-header__inner">
          <span className="site-header__brand">RUNORY</span>
        </div>
      </header>

      {hiddenPage ? (
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">{hiddenPageContent[hiddenPage].eyebrow}</span>
            <h1>{hiddenPageContent[hiddenPage].title}</h1>
            <p className="lead">{hiddenPageContent[hiddenPage].lead}</p>
          </div>

          {hiddenPage === 'contact' ? (
            <section className="contact-layout" aria-label="문의 폼">
              <form className="input-panel contact-form-panel" action={contactFormAction} method="post">
                <label className="field" htmlFor="email">
                  <span className="field-label">Your Email</span>
                  <input name="Email" id="email" type="email" autoComplete="email" required />
                </label>

                <label className="field" htmlFor="message">
                  <span className="field-label">Message</span>
                  <textarea
                    id="message"
                    name="Message"
                    rows={6}
                    placeholder="문의 내용을 적어주세요."
                    required
                  />
                </label>

                <button className="submit-button" type="submit">
                  Submit
                </button>
              </form>

              <section className="info-stack" aria-label="문의 안내">
                {hiddenPageContent[hiddenPage].sections.map((section) => (
                  <article className="info-card" key={section.title}>
                    <h2>{section.title}</h2>
                    <p>{section.body}</p>
                  </article>
                ))}
              </section>
            </section>
          ) : (
            <section className="info-stack" aria-label="사이트 운영 정보">
              {hiddenPageContent[hiddenPage].sections.map((section) => (
                <article className="info-card" key={section.title}>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                </article>
              ))}
            </section>
          )}
        </section>
      ) : null}

      {!hiddenPage && activePage === 'home' ? (
        <section className="hero-card home-card">
          <div className="home-mark">
            <p className="home-description">{homeQuote}</p>
          </div>

          <section className="home-feature-grid" aria-label="오늘의 날씨">
            <article className="info-card home-info-card">
              <span className="shoe-category">Today Weather</span>
              <h2>오늘의 날씨</h2>
              {weatherResult ? (
                <>
                  <strong className="home-highlight">
                    {weatherResult.summary.nextSlot.temperature.toFixed(1)}°C
                  </strong>
                  <p>
                    {weatherResult.summary.nextSlot.timeLabel} ·{' '}
                    {weatherResult.summary.nextSlot.description}
                  </p>
                  <dl className="home-meta-list">
                    <div>
                      <dt>체감온도</dt>
                      <dd>{weatherResult.summary.nextSlot.feelsLike.toFixed(1)}°C</dd>
                    </div>
                    <div>
                      <dt>강수확률</dt>
                      <dd>{Math.round(weatherResult.summary.nextSlot.pop * 100)}%</dd>
                    </div>
                    <div>
                      <dt>기준 도시</dt>
                      <dd>{weatherResult.city.name}</dd>
                    </div>
                  </dl>
                  <p>{weatherResult.summary.caution}</p>
                </>
              ) : weatherLoading ? (
                <p>오늘 날씨 정보를 불러오는 중입니다.</p>
              ) : weatherError ? (
                <p>{weatherError}</p>
              ) : (
                <p>오늘 날씨 정보를 준비 중입니다.</p>
              )}
            </article>
          </section>
        </section>
      ) : null}

      {!hiddenPage && activePage !== 'home' && activePage in hubPages ? (
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">{hubPages[activePage as Exclude<TopLevelSection, 'home'>].eyebrow}</span>
            <h1>{hubPages[activePage as Exclude<TopLevelSection, 'home'>].title}</h1>
            <p className="lead">{hubPages[activePage as Exclude<TopLevelSection, 'home'>].lead}</p>
          </div>

          <section className="hub-grid" aria-label={`${navigationItems.find((item) => item.id === activePage)?.label} 하위 메뉴`}>
            {hubPages[activePage as Exclude<TopLevelSection, 'home'>].cards.map((card) => (
              <article className="hub-card" key={card.id}>
                <span className="shoe-category">{card.badge}</span>
                <h2>{card.title}</h2>
                <p>{card.description}</p>
                <button
                  className="hub-card-button"
                  type="button"
                  onClick={() => handleLeafNavigation(card.id)}
                >
                  이동하기
                </button>
              </article>
            ))}
          </section>
        </section>
      ) : null}

      {!hiddenPage && activePage === 'shoe-recommend' ? (
        <section className="hero-card">
          <div className="section-rail">
            <button
              className="section-back"
              type="button"
              onClick={() => handleNavigationSelect(leafPageMeta['shoe-recommend'].parent)}
            >
              {leafPageMeta['shoe-recommend'].parentLabel}
            </button>
            <span className="section-path">
              {leafPageMeta['shoe-recommend'].parentLabel} / {leafPageMeta['shoe-recommend'].label}
            </span>
          </div>

          <div className="hero-copy">
            <span className="eyebrow">pick</span>
            <h1>러닝화 추천을 위한 정보를 입력하세요</h1>
            <p className="lead">
              성별, 발사이즈, 러닝 목적을 기반으로 러닝화 후보를 정리합니다. 실제 착용감은 발볼, 안정성 선호, 예산에 따라 달라질 수 있습니다.
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

      {!hiddenPage && activePage === 'pace-calculator' ? (
        <section className="hero-card">
          <div className="section-rail">
            <button
              className="section-back"
              type="button"
              onClick={() => handleNavigationSelect(leafPageMeta['pace-calculator'].parent)}
            >
              {leafPageMeta['pace-calculator'].parentLabel}
            </button>
            <span className="section-path">
              {leafPageMeta['pace-calculator'].parentLabel} / {leafPageMeta['pace-calculator'].label}
            </span>
          </div>

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

      {!hiddenPage && activePage === 'race-schedule' ? (
        <section className="hero-card">
          <div className="section-rail">
            <button
              className="section-back"
              type="button"
              onClick={() => handleNavigationSelect(leafPageMeta['race-schedule'].parent)}
            >
              {leafPageMeta['race-schedule'].parentLabel}
            </button>
            <span className="section-path">
              {leafPageMeta['race-schedule'].parentLabel} / {leafPageMeta['race-schedule'].label}
            </span>
          </div>

          <div className="hero-copy">
            <span className="eyebrow">race</span>
            <h1>대회 찾기</h1>
            <p className="lead">
              대회명과 코스를 기준으로 러닝 대회를 탐색하고 일정과 기본 정보를 비교할 수 있습니다.
            </p>
          </div>

          <section className="input-panel race-search-panel" aria-label="대회 검색">
            <div className="summary-header">
              <span>검색</span>
              <div className="race-search-actions">
                <span className="status">{filteredRaces.length}개 결과</span>
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
                <span className="field-label">코스</span>
                <select
                  value={raceCourseFilter}
                  onChange={(event) => setRaceCourseFilter(event.target.value)}
                >
                  <option value="">전체</option>
                  {raceCourseOptions.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="race-list-section" aria-label="대회 리스트">
            {raceLoading ? (
              <p className="results-empty">대회 데이터를 불러오는 중입니다.</p>
            ) : raceError ? (
              <p className="results-empty">{raceError}</p>
            ) : filteredRaces.length > 0 ? (
              <div className="race-list">
                {filteredRaces.map((race) => (
                  <article className="race-card" key={`${race.name}-${race.date}`}>
                    <div className="race-card-head">
                      <div className="race-card-title-block">
                        <div className="course-badge-list" aria-label="참가 코스">
                          {splitCourseLabels(race.course, race.category).map((courseLabel) => (
                            <span
                              className="course-badge"
                              key={`${race.name}-${race.date}-${courseLabel}`}
                            >
                              {courseLabel}
                            </span>
                          ))}
                        </div>
                        <div className="race-title-row">
                          <h3>{race.name}</h3>
                          {race.homepage?.trim() ? (
                            <a
                              className="race-homepage-link"
                              href={race.homepage}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${race.name} 홈페이지 이동`}
                              title="홈페이지 이동"
                            >
                              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                                <path
                                  d="M6 3h7v7M13 3 3 13M10 13H3V6"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <span
                        className={`status ${
                          race.status === '예정'
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
                        <dt>주최</dt>
                        <dd>{race.organizer?.trim() || '-'}</dd>
                      </div>
                      <div>
                        <dt>장소</dt>
                        <dd>{race.venue?.trim() || '-'}</dd>
                      </div>
                    </dl>

                  </article>
                ))}
              </div>
            ) : (
              <p className="results-empty">
                진행중인 대회가 없습니다.
              </p>
            )}
          </section>
        </section>
      ) : null}

      {!hiddenPage && activePage === 'training-plan' ? (
        <section className="hero-card">
          <div className="section-rail">
            <button
              className="section-back"
              type="button"
              onClick={() => handleNavigationSelect(leafPageMeta['training-plan'].parent)}
            >
              {leafPageMeta['training-plan'].parentLabel}
            </button>
            <span className="section-path">
              {leafPageMeta['training-plan'].parentLabel} / {leafPageMeta['training-plan'].label}
            </span>
          </div>

          <div className="hero-copy">
            <span className="eyebrow">train</span>
            <h1>훈련 계획표 추출</h1>
            <p className="lead">
              현재 기록, 목표 대회, 주간 훈련 상태를 입력하면 OpenAI 기반으로 주차별 훈련 계획표를 생성합니다.
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

      {!hiddenPage && activePage === 'weather' ? (
        <section className="hero-card">
          <div className="section-rail">
            <button
              className="section-back"
              type="button"
              onClick={() => handleNavigationSelect(leafPageMeta.weather.parent)}
            >
              {leafPageMeta.weather.parentLabel}
            </button>
            <span className="section-path">
              {leafPageMeta.weather.parentLabel} / {leafPageMeta.weather.label}
            </span>
          </div>

          <div className="hero-copy">
            <span className="eyebrow">weather</span>
            <h1>러닝 날씨</h1>
            <p className="lead">
              서울 기준 OpenWeather 5일 / 3시간 예보를 바탕으로 러닝 전 확인이 필요한 기온, 강수확률, 바람 정보를 확인합니다.
            </p>
          </div>

          <div className="weather-layout">
            <aside className="summary-card weather-summary" aria-label="러닝 날씨 요약">
              <div className="summary-header">
                <span>오늘 날씨 정보</span>
                <span className={weatherResult ? 'status ready' : 'status'}>
                  {weatherResult ? weatherResult.city.name : '대기'}
                </span>
              </div>

              {weatherResult ? (
                <>
                  <div className="weather-primary-card">
                    <span className="pace-caption">가장 가까운 예보</span>
                    <strong>
                      {weatherResult.summary.nextSlot.temperature.toFixed(1)}°C
                    </strong>
                    <p>
                      {weatherResult.summary.nextSlot.timeLabel} ·{' '}
                      {weatherResult.summary.nextSlot.description}
                    </p>
                  </div>

                  <dl className="summary-list">
                    <div>
                      <dt>체감온도</dt>
                      <dd>{weatherResult.summary.nextSlot.feelsLike.toFixed(1)}°C</dd>
                    </div>
                    <div>
                      <dt>강수확률</dt>
                      <dd>{Math.round(weatherResult.summary.nextSlot.pop * 100)}%</dd>
                    </div>
                  </dl>

                  <p className="summary-note">{weatherResult.summary.caution}</p>
                </>
              ) : (
                <p className="results-empty">
                  서울 기준 날씨 요약을 불러오면 여기에 표시됩니다.
                </p>
              )}
            </aside>
          </div>

          <section className="results" aria-label="5일 예보 결과">
            <div className="results-head">
              <div>
                <h2>{weatherLoading ? '날씨 불러오는 중' : '5일 예보'}</h2>
              </div>
            </div>

            {weatherLoading ? (
              <p className="results-tip">OpenWeather 예보 데이터를 정리하는 중입니다.</p>
            ) : weatherError ? (
              <div className="error-box" role="alert">
                <strong>날씨 조회 실패</strong>
                <p>{weatherError}</p>
              </div>
            ) : weatherResult ? (
              <>
                <div className="weather-day-grid">
                  {weatherResult.days.map((day) => (
                    <article className="weather-primary-card" key={day.date}>
                      <span className="shoe-category">{day.label}</span>
                      <h3>{day.topDescription}</h3>
                      <p>
                        {day.minTemp.toFixed(1)}°C ~ {day.maxTemp.toFixed(1)}°C
                      </p>
                      <p>평균 강수확률 {Math.round(day.avgPop * 100)}%</p>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="results-empty">
                서울 기준 예보를 불러오면 여기에 5일 / 3시간 날씨 정보가 표시됩니다.
              </p>
            )}
          </section>
        </section>
      ) : null}

      {!hiddenPage &&
      (activePage === 'injury-types' ||
        activePage === 'injury-prevention' ||
        activePage === 'injury-recovery') ? (
        <section className="hero-card">
          <div className="section-rail">
            <button
              className="section-back"
              type="button"
              onClick={() =>
                handleNavigationSelect(leafPageMeta[activePage as LeafPage].parent)
              }
            >
              {leafPageMeta[activePage as LeafPage].parentLabel}
            </button>
            <span className="section-path">
              {leafPageMeta[activePage as LeafPage].parentLabel} /{' '}
              {leafPageMeta[activePage as LeafPage].label}
            </span>
          </div>

          <div className="hero-copy">
            <span className="eyebrow">
              {injuryPageContent[activePage as keyof typeof injuryPageContent].eyebrow}
            </span>
            <h1>{injuryPageContent[activePage as keyof typeof injuryPageContent].title}</h1>
            <p className="lead">
              {injuryPageContent[activePage as keyof typeof injuryPageContent].lead}
            </p>
          </div>

          <section className="site-footer site-footer-embedded" aria-label="부상 정보">
            {injuryPageContent[activePage as keyof typeof injuryPageContent].sections.map(
              (section) => (
                <article className="info-card" key={section.title}>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                </article>
              ),
            )}
          </section>
        </section>
      ) : null}

      {!hiddenPage && activePage === 'injury-ai-diagnosis' ? (
        <section className="hero-card placeholder-card">
          <div className="section-rail">
            <button
              className="section-back"
              type="button"
              onClick={() => handleNavigationSelect(leafPageMeta['injury-ai-diagnosis'].parent)}
            >
              {leafPageMeta['injury-ai-diagnosis'].parentLabel}
            </button>
            <span className="section-path">
              {leafPageMeta['injury-ai-diagnosis'].parentLabel} /{' '}
              {leafPageMeta['injury-ai-diagnosis'].label}
            </span>
          </div>

          <div className="placeholder-copy">
            <span className="eyebrow">ai diagnosis</span>
            <h1>AI진단</h1>
            <p>준비중입니다.</p>
          </div>
        </section>
      ) : null}

      {!hiddenPage &&
      activePage !== 'home' &&
      !(activePage in hubPages) &&
      !(activePage in leafPageMeta) ? (
        <section className="hero-card placeholder-card">
          <div className="placeholder-copy">
            <span className="eyebrow">RUNORY</span>
            <h1>{navigationItems.find((item) => item.id === activePage)?.label}</h1>
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
                activeTopLevel === item.id ? 'navigation-item active' : 'navigation-item'
              }
              aria-current={activeTopLevel === item.id ? 'page' : undefined}
              aria-label={item.label}
              onClick={() => handleNavigationSelect(item.id)}
            >
              <span className="navigation-icon" aria-hidden="true">
                {item.shortLabel}
              </span>
              <span className="navigation-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <footer className="site-policy-footer" aria-label="정책 및 운영 링크">
        <div className="site-policy-footer__inner">
          <div className="site-policy-footer__copy">
            <strong>okerry</strong>
            <p>러닝 정보와 도구를 제공하는 안내형 서비스입니다.</p>
          </div>
          <div className="site-policy-footer__links">
            {siteLinks.map((link) => (
              <button
                key={link.id}
                className="site-policy-link"
                type="button"
                onClick={() => handleHiddenPageOpen(link.id)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
