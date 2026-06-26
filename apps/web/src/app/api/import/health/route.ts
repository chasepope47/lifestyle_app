import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const householdId = formData.get('householdId') as string
    const userId = formData.get('userId') as string

    if (!file || !householdId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })
    }

    const supabase = await createClient()
    const results = []

    if (file.name.endsWith('.xml')) {
      const result = await parseAppleHealth(file, supabase, householdId, userId)
      results.push(...result)
    } else if (file.name.endsWith('.zip')) {
      const result = await parseGarmin(file, supabase, householdId, userId)
      results.push(...result)
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please use XML (Apple Health) or ZIP (Garmin)' }, { status: 400 })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process import' },
      { status: 500 }
    )
  }
}

async function parseAppleHealth(file: File, supabase: any, householdId: string, userId: string) {
  const text = await file.text()
  const metricsMap = new Map()

  // Simple regex-based parsing for Apple Health XML
  // Match <Record type="..." startDate="..." endDate="..." value="..." .../>
  const recordRegex = /<Record[^>]*type="([^"]*)"[^>]*startDate="([^"]*)"[^>]*value="([^"]*)"[^>]*\/>/g
  let match

  while ((match = recordRegex.exec(text)) !== null) {
    const type = match[1]
    const startDate = match[2].split(' ')[0] // Extract date from "2024-06-25 10:30:00 +0000"
    const value = match[3]

    if (!startDate || !type || !value) continue

    if (!metricsMap.has(startDate)) {
      metricsMap.set(startDate, {})
    }

    const metrics = metricsMap.get(startDate)

    switch (type) {
      case 'HKQuantityTypeIdentifierStepCount':
        metrics.steps = parseInt(value)
        break
      case 'HKQuantityTypeIdentifierActiveEnergyBurned':
        metrics.calories_burned = Math.round(parseFloat(value))
        break
      case 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN':
      case 'HKQuantityTypeIdentifierHeartRate':
        if (!metrics.heart_rate_avg) metrics.heart_rate_avg = Math.round(parseFloat(value))
        break
      case 'HKCategoryTypeIdentifierSleepAnalysis':
        if (!metrics.sleep_hours) metrics.sleep_hours = 8
        break
    }
  }

  // Insert health metrics
  const metricsToInsert = []
  for (const [date, metrics] of metricsMap) {
    if (Object.keys(metrics).length > 0) {
      metricsToInsert.push({
        user_id: userId,
        household_id: householdId,
        source: 'apple_health',
        metric_date: date,
        ...metrics,
      })
    }
  }

  if (metricsToInsert.length > 0) {
    const { error } = await supabase
      .from('health_metrics')
      .upsert(metricsToInsert, { onConflict: 'user_id,source,metric_date' })

    if (error) {
      return [{ success: false, message: `Failed to import health metrics: ${error.message}` }]
    } else {
      return [{ success: true, message: 'Health metrics imported', count: metricsToInsert.length, type: 'metric days' }]
    }
  }

  return [{ success: true, message: 'No health data found in export' }]
}

async function parseGarmin(file: File, supabase: any, householdId: string, userId: string) {
  const zip = new JSZip()
  const contents = await zip.loadAsync(file)
  const results = []

  // Parse activities (workouts)
  const activitiesDir = Object.keys(contents.files).filter(f => f.includes('Activities'))
  const workoutsToInsert = []

  for (const filename of activitiesDir) {
    if (filename.endsWith('.tcx') || filename.endsWith('.gpx')) {
      const content = await contents.file(filename)?.async('text')
      if (content) {
        const workoutData = parseTCXorGPX(content, filename)
        if (workoutData) {
          workoutData.user_id = userId
          workoutData.household_id = householdId
          workoutsToInsert.push(workoutData)
        }
      }
    }
  }

  if (workoutsToInsert.length > 0) {
    const { error } = await supabase.from('workout_sessions').insert(workoutsToInsert)
    if (error) {
      results.push({ success: false, message: `Failed to import workouts: ${error.message}` })
    } else {
      results.push({ success: true, message: 'Workouts imported', count: workoutsToInsert.length, type: 'workouts' })
    }
  }

  // Parse daily summaries
  const summariesDir = Object.keys(contents.files).filter(f => f.includes('DailySummaryData'))
  const metricsToInsert = []

  for (const filename of summariesDir) {
    if (filename.endsWith('.json')) {
      const content = await contents.file(filename)?.async('text')
      if (content) {
        try {
          const data = JSON.parse(content)
          const metricsData = parseGarminDailySummary(data, userId, householdId)
          metricsToInsert.push(...metricsData)
        } catch (e) {
          console.error('Failed to parse daily summary:', e)
        }
      }
    }
  }

  if (metricsToInsert.length > 0) {
    const { error } = await supabase
      .from('health_metrics')
      .upsert(metricsToInsert, { onConflict: 'user_id,source,metric_date' })

    if (error) {
      results.push({ success: false, message: `Failed to import health metrics: ${error.message}` })
    } else {
      results.push({ success: true, message: 'Daily metrics imported', count: metricsToInsert.length, type: 'metric days' })
    }
  }

  return results.length > 0 ? results : [{ success: true, message: 'Import completed' }]
}

function parseTCXorGPX(content: string, filename: string) {
  try {
    // Extract start time from <Activity startTime="2024-06-25T10:30:00Z" or <time>2024-06-25T10:30:00Z</time>
    let startTime: string | null = null
    const timeMatch = content.match(/<time>([^<]+)<\/time>/) || content.match(/startTime="([^"]+)"/)
    if (timeMatch) startTime = timeMatch[1]

    if (!startTime) return null

    // Extract total distance (in meters) and duration (in seconds)
    let totalDistance = 0
    let totalDuration = 0

    // TCX format: <DistanceMeters>1234.56</DistanceMeters>
    const distanceMatches = content.match(/<DistanceMeters>([^<]+)<\/DistanceMeters>/g)
    if (distanceMatches) {
      for (const match of distanceMatches) {
        const distance = parseFloat(match.replace(/<\/?DistanceMeters>/g, ''))
        totalDistance += distance
      }
    }

    // TCX format: <TotalTimeSeconds>3600</TotalTimeSeconds>
    const durationMatches = content.match(/<TotalTimeSeconds>([^<]+)<\/TotalTimeSeconds>/g)
    if (durationMatches) {
      for (const match of durationMatches) {
        const duration = parseFloat(match.replace(/<\/?TotalTimeSeconds>/g, ''))
        totalDuration += duration
      }
    }

    return {
      started_at: startTime,
      ended_at: new Date(new Date(startTime).getTime() + totalDuration * 1000).toISOString(),
      title: `${filename.split('/').pop()?.replace(/\.[^/.]+$/, '')} (Garmin)`,
      duration_minutes: Math.round(totalDuration / 60),
    }
  } catch (e) {
    console.error('Error parsing TCX/GPX:', e)
    return null
  }
}

function parseGarminDailySummary(data: any, userId: string, householdId: string) {
  const metrics = []

  // Handle both direct data and data.summaryData structure
  const summaries = Array.isArray(data) ? data : data.summaryData || [data]

  for (const summary of summaries) {
    if (!summary.calendarDate) continue

    metrics.push({
      user_id: userId,
      household_id: householdId,
      source: 'garmin',
      metric_date: summary.calendarDate,
      steps: summary.totalSteps,
      calories_burned: summary.activeKilocalories || summary.totalKilocalories,
      active_minutes: summary.activeMinutes || summary.intensityMinutesHigh ? (summary.intensityMinutesHigh + summary.intensityMinutesModerate) : undefined,
      heart_rate_avg: summary.restingHeartRateInBeatsPerMinute,
      sleep_hours: summary.sleepData ? (summary.sleepData.totalSleepInSeconds / 3600) : undefined,
    })
  }

  return metrics
}
