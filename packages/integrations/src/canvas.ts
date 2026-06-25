// Canvas LMS integration
// No OAuth required — user generates a personal API token from Canvas Account Settings
// Token stored in integration_tokens table (access_token field)
// User must also provide their Canvas instance URL (stored in metadata.instance_url)

export interface CanvasCourse {
  id: number
  name: string
  course_code: string
  enrollment_term_id: number
  workflow_state: string
}

export interface CanvasAssignment {
  id: number
  name: string
  description?: string
  due_at?: string
  points_possible?: number
  course_id: number
  submission?: {
    grade?: string
    submitted_at?: string
    workflow_state: string
  }
}

export async function getCanvasCourses(instanceUrl: string, apiToken: string): Promise<CanvasCourse[]> {
  const url = `${instanceUrl.replace(/\/$/, '')}/api/v1/courses?enrollment_state=active&per_page=50`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiToken}` },
  })
  if (res.status === 401) throw new Error('CANVAS_TOKEN_INVALID')
  if (!res.ok) throw new Error(`Canvas API error: ${res.status}`)
  return await res.json() as CanvasCourse[]
}

export async function getCanvasAssignments(instanceUrl: string, apiToken: string, courseId: number): Promise<CanvasAssignment[]> {
  const url = `${instanceUrl.replace(/\/$/, '')}/api/v1/courses/${courseId}/assignments?per_page=100&include[]=submission`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiToken}` },
  })
  if (res.status === 401) throw new Error('CANVAS_TOKEN_INVALID')
  if (!res.ok) throw new Error(`Canvas API error: ${res.status}`)
  return await res.json() as CanvasAssignment[]
}

export function canvasAssignmentToDbAssignment(
  assignment: CanvasAssignment,
  courseDbId: string,
  userId: string,
  householdId: string
) {
  const sub = assignment.submission
  let status: 'todo' | 'in_progress' | 'submitted' | 'graded' = 'todo'
  if (sub?.workflow_state === 'graded') status = 'graded'
  else if (sub?.submitted_at) status = 'submitted'

  return {
    user_id: userId,
    household_id: householdId,
    class_id: courseDbId,
    title: assignment.name,
    description: assignment.description ? stripHtml(assignment.description) : null,
    due_date: assignment.due_at ?? null,
    status,
    grade: sub?.grade ? parseFloat(sub.grade) || null : null,
    grade_scale: assignment.points_possible ? String(assignment.points_possible) : '100',
    provider: 'canvas' as const,
    external_id: String(assignment.id),
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}
