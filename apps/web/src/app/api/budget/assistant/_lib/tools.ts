import { z } from 'zod'
import { SchemaType, type FunctionDeclaration } from '@google/generative-ai'

// --- Read tools (auto-executed server-side, scoped to the household via RLS) ---

export const READ_TOOLS: FunctionDeclaration[] = [
  {
    name: 'get_transactions',
    description: 'List transactions for the household, optionally filtered by date range, envelope category, or a text search on description/merchant.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        start_date: { type: SchemaType.STRING, description: 'YYYY-MM-DD, inclusive' },
        end_date: { type: SchemaType.STRING, description: 'YYYY-MM-DD, inclusive' },
        category_id: { type: SchemaType.STRING, description: 'Filter to a single envelope category id' },
        search: { type: SchemaType.STRING, description: 'Case-insensitive match against description or merchant' },
        limit: { type: SchemaType.NUMBER, description: 'Max rows to return, default 50, max 200' },
      },
    },
  },
  {
    name: 'get_categories',
    description: "List the household's envelope (budget) categories with their monthly limit and amount spent in a date range (defaults to the current calendar month).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        start_date: { type: SchemaType.STRING, description: 'YYYY-MM-DD, inclusive. Defaults to start of current month.' },
        end_date: { type: SchemaType.STRING, description: 'YYYY-MM-DD, inclusive. Defaults to today.' },
      },
    },
  },
  {
    name: 'get_goals',
    description: "List the household's budget goals (savings targets, spending limits, debt payoff plans).",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'get_accounts',
    description: "List the household's budget accounts (checking, savings, credit, cash, investment). Needed to know a valid account_id before creating a transaction.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'get_summary',
    description: 'Get total income, total expenses, and savings for a date range (defaults to the current calendar month).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        start_date: { type: SchemaType.STRING, description: 'YYYY-MM-DD, inclusive. Defaults to start of current month.' },
        end_date: { type: SchemaType.STRING, description: 'YYYY-MM-DD, inclusive. Defaults to today.' },
      },
    },
  },
]

// --- Write tools (NEVER auto-executed; surfaced to the user as a pending action) ---

export const WRITE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'create_transaction',
    description: 'Propose creating a new transaction. amount is negative for an expense, positive for income.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        account_id: { type: SchemaType.STRING, description: 'Required. Get a valid id from get_accounts first.' },
        amount: { type: SchemaType.NUMBER },
        description: { type: SchemaType.STRING },
        merchant: { type: SchemaType.STRING },
        transaction_date: { type: SchemaType.STRING, description: 'YYYY-MM-DD, defaults to today' },
        category_id: { type: SchemaType.STRING, description: 'Envelope category id from get_categories, if known' },
        notes: { type: SchemaType.STRING },
      },
      required: ['account_id', 'amount', 'description'],
    },
  },
  {
    name: 'update_transaction',
    description: 'Propose updating an existing transaction. Only include fields that should change.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING },
        amount: { type: SchemaType.NUMBER },
        description: { type: SchemaType.STRING },
        merchant: { type: SchemaType.STRING },
        transaction_date: { type: SchemaType.STRING },
        category_id: { type: SchemaType.STRING },
        notes: { type: SchemaType.STRING },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_transaction',
    description: 'Propose deleting a transaction.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { id: { type: SchemaType.STRING } },
      required: ['id'],
    },
  },
  {
    name: 'create_category',
    description: 'Propose creating a new envelope (budget) category.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        monthly_limit: { type: SchemaType.NUMBER },
        color: { type: SchemaType.STRING, description: 'Hex color, e.g. #7c3aed' },
        icon: { type: SchemaType.STRING, description: 'A single emoji' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_category',
    description: 'Propose updating an envelope category. Only include fields that should change.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING },
        name: { type: SchemaType.STRING },
        monthly_limit: { type: SchemaType.NUMBER },
        color: { type: SchemaType.STRING },
        icon: { type: SchemaType.STRING },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_category',
    description: 'Propose deleting an envelope category. Transactions referencing it will have their category_id cleared, not be deleted.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { id: { type: SchemaType.STRING } },
      required: ['id'],
    },
  },
  {
    name: 'create_goal',
    description: 'Propose creating a new budget goal.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        goal_type: { type: SchemaType.STRING, description: 'One of: savings, spending_limit, debt_payoff' },
        target_amount: { type: SchemaType.NUMBER },
        category_id: { type: SchemaType.STRING, description: 'Linked envelope category, if any' },
        target_date: { type: SchemaType.STRING, description: 'YYYY-MM-DD' },
        notes: { type: SchemaType.STRING },
      },
      required: ['name', 'goal_type', 'target_amount'],
    },
  },
  {
    name: 'update_goal',
    description: 'Propose updating a budget goal. Only include fields that should change.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING },
        name: { type: SchemaType.STRING },
        goal_type: { type: SchemaType.STRING },
        target_amount: { type: SchemaType.NUMBER },
        current_amount: { type: SchemaType.NUMBER },
        category_id: { type: SchemaType.STRING },
        target_date: { type: SchemaType.STRING },
        notes: { type: SchemaType.STRING },
        achieved_at: { type: SchemaType.STRING, description: 'ISO timestamp, set to mark the goal achieved' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_goal',
    description: 'Propose deleting a budget goal.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { id: { type: SchemaType.STRING } },
      required: ['id'],
    },
  },
]

export const WRITE_TOOL_NAMES = new Set(WRITE_TOOLS.map(t => t.name))

// --- Zod validation for write-tool inputs, used by the execute route before any DB write ---

export const writeToolSchemas = {
  create_transaction: z.object({
    account_id: z.string().uuid(),
    amount: z.number(),
    description: z.string().min(1),
    merchant: z.string().optional(),
    transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    category_id: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
  update_transaction: z.object({
    id: z.string().uuid(),
    amount: z.number().optional(),
    description: z.string().min(1).optional(),
    merchant: z.string().optional(),
    transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    category_id: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
  delete_transaction: z.object({
    id: z.string().uuid(),
  }),
  create_category: z.object({
    name: z.string().min(1),
    monthly_limit: z.number().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
  }),
  update_category: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    monthly_limit: z.number().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
  }),
  delete_category: z.object({
    id: z.string().uuid(),
  }),
  create_goal: z.object({
    name: z.string().min(1),
    goal_type: z.enum(['savings', 'spending_limit', 'debt_payoff']),
    target_amount: z.number().positive(),
    category_id: z.string().uuid().optional(),
    target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().optional(),
  }),
  update_goal: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    goal_type: z.enum(['savings', 'spending_limit', 'debt_payoff']).optional(),
    target_amount: z.number().positive().optional(),
    current_amount: z.number().optional(),
    category_id: z.string().uuid().optional(),
    target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().optional(),
    achieved_at: z.string().optional(),
  }),
  delete_goal: z.object({
    id: z.string().uuid(),
  }),
} as const

export type WriteToolName = keyof typeof writeToolSchemas
