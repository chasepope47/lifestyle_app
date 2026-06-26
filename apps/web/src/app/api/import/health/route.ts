import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { xml2js } from 'xml-js'

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
  const data = xml2js(text, { compact: true })

  const results = []
  const healthData = data.HealthData?.Record

  if (!healthData) {
    return [{ success: false, message: 'No health records found in export' }]
  }

  const records = Array.isArray(healthData) ? healthData : [healthData]
  const metricsMap = new Map()

  for (const record of records) {
    const type = record._attributes?.type
    const date = record._attributes?.startDate?.split(' ')[0]
    const value = record._attributes?.value

    if (!date || !type || !value) continue

    if (!metricsMap.has(date)) {
      metricsMap.set(date, {})
    }

    const metrics = metricsMap.get(date)

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
        // Sleep is more complex, approximate 8 hours for now
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
      results.push({ success: false, message: `Failed to import health metrics: ${error.message}` })
    } else {
      results.push({ success: true, message: 'Health metrics imported', count: metricsToInsert.length, type: 'metric days' })
    }
  }

  return results
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
    const data = xml2js(content, { compact: true })
    const activity = data.TrainingCenterDatabase?.Activities?.Activity || data.gpx?.trk

    if (!activity) return null

    const startTime = activity.Id || activity.time?._text
    const laps = Array.isArray(activity.Lap) ? activity.Lap : [activity.Lap]

    let totalDistance = 0
    let totalDuration = 0

    if (laps) {
      for (const lap of laps) {
        const distance = parseFloat(lap.DistanceMeters?._text || '0')
        const duration = parseFloat(lap.TotalTimeSeconds?._text || '0')
        totalDistance += distance
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
