// Garmin Health API integration
// Requires developer program enrollment: https://developer.garmin.com/gc-developer-program/overview/
// OAuth 2.0 flow — tokens stored in integration_tokens table

export interface GarminActivity {
  activityId: string
  activityName: string
  activityType: string
  startTimeLocal: string
  duration: number        // seconds
  distance?: number       // meters
  calories?: number
  averageHR?: number
  maxHR?: number
}

export interface GarminDailySummary {
  calendarDate: string
  totalSteps?: number
  totalDistanceMeters?: number
  activeTimeInSeconds?: number
  bmrKilocalories?: number
  activeKilocalories?: number
  averageHeartRateInBeatsPerMinute?: number
  sleepingSeconds?: number
}

const GARMIN_API_BASE = 'https://healthapi.garmin.com/wellness-api/rest'

export async function getActivities(accessToken: string, startDate: string, endDate: string): Promise<GarminActivity[]> {
  const res = await fetch(
    `${GARMIN_API_BASE}/activities?startDate=${startDate}&endDate=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (res.status === 401) throw new Error('GARMIN_TOKEN_EXPIRED')
  if (!res.ok) throw new Error(`Garmin API error: ${res.status}`)
  const json = await res.json() as { data: GarminActivity[] }
  return json.data ?? []
}

export async function getDailySummary(accessToken: string, date: string): Promise<GarminDailySummary | null> {
  const res = await fetch(
    `${GARMIN_API_BASE}/dailies?startDate=${date}&endDate=${date}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (res.status === 401) throw new Error('GARMIN_TOKEN_EXPIRED')
  if (!res.ok) return null
  const json = await res.json() as { data: GarminDailySummary[] }
  return json.data?.[0] ?? null
}

export function garminActivityToWorkoutSession(activity: GarminActivity, userId: string, householdId: string) {
  const startedAt = new Date(activity.startTimeLocal).toISOString()
  const endedAt = new Date(new Date(activity.startTimeLocal).getTime() + activity.duration * 1000).toISOString()
  return {
    user_id: userId,
    household_id: householdId,
    started_at: startedAt,
    ended_at: endedAt,
    title: activity.activityName || activity.activityType,
    notes: `Synced from Garmin — ${activity.activityType}`,
  }
}

export function garminDailyToHealthMetric(summary: GarminDailySummary, userId: string, householdId: string) {
  return {
    user_id: userId,
    household_id: householdId,
    source: 'garmin' as const,
    metric_date: summary.calendarDate,
    steps: summary.totalSteps ?? null,
    calories_burned: summary.activeKilocalories ?? null,
    active_minutes: summary.activeTimeInSeconds ? Math.floor(summary.activeTimeInSeconds / 60) : null,
    heart_rate_avg: summary.averageHeartRateInBeatsPerMinute ?? null,
    sleep_hours: summary.sleepingSeconds ? Math.round(summary.sleepingSeconds / 360) / 10 : null,
  }
}

// OAuth helpers — actual redirect URLs handled in Next.js route handlers
export function getGarminAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    scope: 'ACTIVITY_EXPORT DAILY_SUMMARY SLEEP',
  })
  return `https://connect.garmin.com/oauth2Confirm?${params}`
}
