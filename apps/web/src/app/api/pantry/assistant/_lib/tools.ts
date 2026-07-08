import { z } from 'zod'
import { Type, type FunctionDeclaration } from '@google/genai'

// --- Read tools (auto-executed server-side, scoped to the household via RLS) ---

export const READ_TOOLS: FunctionDeclaration[] = [
  {
    name: 'get_pantry_items',
    description:
      "List the household's pantry items. status filters to what's actually on hand and cookable " +
      "('active': not empty and not expired/critical), what needs restocking " +
      "('needs_restock': empty, or expired/critical/soon), or 'all'. Defaults to 'active'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: "One of 'active', 'needs_restock', 'all'. Defaults to 'active'." },
        category: { type: Type.STRING, description: 'Filter to a single category, e.g. Produce, Dairy, Frozen' },
        search: { type: Type.STRING, description: 'Case-insensitive match against item name' },
      },
    },
  },
  {
    name: 'get_meal_plans',
    description: "List the household's planned meals in a date range (defaults to the next 7 days).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        start_date: { type: Type.STRING, description: 'YYYY-MM-DD, inclusive. Defaults to today.' },
        end_date: { type: Type.STRING, description: 'YYYY-MM-DD, inclusive. Defaults to 7 days from today.' },
      },
    },
  },
]

// --- Write tools (NEVER auto-executed; surfaced to the user as a pending action) ---

export const WRITE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'create_meal_plan',
    description: 'Propose adding a planned meal to the meal plan.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        planned_date: { type: Type.STRING, description: 'YYYY-MM-DD' },
        meal_type: { type: Type.STRING, description: 'One of: breakfast, lunch, dinner, snack' },
        recipe_name: { type: Type.STRING },
        notes: { type: Type.STRING, description: 'Optional, e.g. which pantry items it uses up' },
      },
      required: ['planned_date', 'meal_type', 'recipe_name'],
    },
  },
  {
    name: 'update_meal_plan',
    description: 'Propose updating an existing planned meal. Only include fields that should change.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        planned_date: { type: Type.STRING },
        meal_type: { type: Type.STRING },
        recipe_name: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_meal_plan',
    description: 'Propose removing a planned meal.',
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING } },
      required: ['id'],
    },
  },
]

export const WRITE_TOOL_NAMES = new Set(WRITE_TOOLS.map(t => t.name))

// --- Zod validation for write-tool inputs, used by the execute route before any DB write ---

const MEAL_TYPE_ENUM = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const writeToolSchemas = {
  create_meal_plan: z.object({
    planned_date: z.string().regex(DATE_RE),
    meal_type: MEAL_TYPE_ENUM,
    recipe_name: z.string().min(1),
    notes: z.string().optional(),
  }),
  update_meal_plan: z.object({
    id: z.string().uuid(),
    planned_date: z.string().regex(DATE_RE).optional(),
    meal_type: MEAL_TYPE_ENUM.optional(),
    recipe_name: z.string().min(1).optional(),
    notes: z.string().optional(),
  }),
  delete_meal_plan: z.object({
    id: z.string().uuid(),
  }),
} as const

export type WriteToolName = keyof typeof writeToolSchemas
