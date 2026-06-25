// Bevel Health integration
// Bevel aggregates wearable + health data from multiple sources into one API
// Confirm API base URL and endpoints against Bevel developer documentation
// OAuth 2.0 flow — tokens stored in integration_tokens table

export interface BevelWorkout {
  id: string
  name: string
  startTime: string
  endTime: string
  type: string
  durationSeconds: number
  distanceMeters?: number
  caloriesBurned?: number
  heartRateAvg?: number
}

export interface BevelDailyMetrics {
  date: string
  steps?: number
  caloriesActive?: number
  activeMinutes?: number
  heartRateResting?: number
  heartRateAvg?: number
  sleepHours?: number
}

// Placeholder — update BEVEL_API_BASE to actual URL from Bevel docs
const BEVEL_API_BASE = process.env.BEVEL_API_BASE_URL ?? 'https://api.bevelhq.com/v1'

export async function getBevelWorkouts(accessToken: string, startDate: string, endDate: string): Promise<BevelWorkout[]> {
  const res = await fetch(
    `${BEVEL_API_BASE}/workouts?start=${startDate}&end=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (res.status === 401) throw new Error('BEVEL_TOKEN_EXPIRED')
  if (!res.ok) throw new Error(`Bevel API error: ${res.status}`)
  const json = await res.json() as { workouts: BevelWorkout[] }
  return json.workouts ?? []
}

export async function getBevelDailyMetrics(accessToken: string, date: string): Promise<BevelDailyMetrics | null> {
  const res = await fetch(
    `${BEVEL_API_BASE}/metrics/daily?date=${date}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (res.status === 401) throw new Error('BEVEL_TOKEN_EXPIRED')
  if (!res.ok) return null
  return await res.json() as BevelDailyMetrics
}

export function bevelWorkoutToWorkoutSession(workout: BevelWorkout, userId: string, householdId: string) {
  return {
    user_id: userId,
    household_id: householdId,
    started_at: workout.startTime,
    ended_at: workout.endTime,
    title: workout.name || workout.type,
    notes: `Synced from Bevel — ${workout.type}`,
  }
}

export function bevelDailyToHealthMetric(metrics: BevelDailyMetrics, userId: string, householdId: string) {
  return {
    user_id: userId,
    household_id: householdId,
    source: 'bevel' as const,
    metric_date: metrics.date,
    steps: metrics.steps ?? null,
    calories_burned: metrics.caloriesActive ?? null,
    active_minutes: metrics.activeMinutes ?? null,
    heart_rate_avg: metrics.heartRateAvg ?? null,
    sleep_hours: metrics.sleepHours ?? null,
  }
}

export function getBevelAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    scope: 'workouts metrics:read',
  })
  return `${BEVEL_API_BASE}/oauth/authorize?${params}`
}
