export const MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'budget', label: 'Budget', icon: 'Wallet' },
  { id: 'pantry', label: 'Pantry', icon: 'ShoppingBasket' },
  { id: 'nutrition', label: 'Nutrition', icon: 'Apple' },
  { id: 'workouts', label: 'Workouts', icon: 'Dumbbell' },
  { id: 'journal', label: 'Journal', icon: 'BookOpen' },
  { id: 'school', label: 'School', icon: 'GraduationCap' },
  { id: 'religious', label: 'Faith', icon: 'BookHeart' },
] as const

export type ModuleId = typeof MODULES[number]['id']

export const PANTRY_CATEGORIES = [
  'Produce', 'Dairy', 'Meat & Seafood', 'Frozen', 'Canned & Dry',
  'Beverages', 'Snacks', 'Condiments', 'Bakery', 'Other',
] as const

export const BUDGET_ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'investment', label: 'Investment' },
] as const

export const DEFAULT_BUDGET_CATEGORIES = [
  { name: 'Housing', icon: 'Home', color: '#6366f1' },
  { name: 'Food & Dining', icon: 'Utensils', color: '#f59e0b' },
  { name: 'Transportation', icon: 'Car', color: '#3b82f6' },
  { name: 'Health & Fitness', icon: 'Heart', color: '#ef4444' },
  { name: 'Entertainment', icon: 'Tv', color: '#8b5cf6' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Education', icon: 'BookOpen', color: '#14b8a6' },
  { name: 'Utilities', icon: 'Zap', color: '#f97316' },
  { name: 'Income', icon: 'TrendingUp', color: '#22c55e' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#6b7280' },
]

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Full Body', 'Cardio',
] as const

export const EQUIPMENT_TYPES = [
  'Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Cable', 'Bodyweight',
  'Resistance Band', 'Treadmill', 'Rower', 'Bike', 'Other',
] as const

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export const MOOD_OPTIONS = [
  { value: 'great', label: 'Great', emoji: '😁' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'low', label: 'Low', emoji: '😔' },
  { value: 'bad', label: 'Bad', emoji: '😞' },
] as const

export const ASSIGNMENT_STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'graded', label: 'Graded' },
] as const

export const SCRIPTURE_TRANSLATIONS = ['NIV', 'KJV', 'ESV', 'NLT', 'NASB', 'CSB', 'MSG', 'AMP'] as const

export const GOSPEL_LIBRARY_URL = 'https://www.churchofjesuschrist.org/study'
export const GOSPEL_LIBRARY_DEEP_LINK = 'gospellibrary://'
