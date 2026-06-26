# Together — Your Lifestyle App

A comprehensive lifestyle management app built for couples. Track budgets, workouts, nutrition, journal entries, school progress, faith goals, and pantry inventory — all in one place with household accountability.

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **pnpm** 10.x (monorepo package manager)
- **PostgreSQL** via Supabase (database)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

---

## ✨ Features & Tutorials

### 1. Full-Screen Modal Pages

All pages in the app open as full-screen modals for an immersive "app within an app" experience.

**How it works:**
- Click any section in the sidebar (Dashboard, Budget, Workouts, etc.)
- The page opens full-screen with a dark overlay
- Press the X button or navigate to close and return to the dashboard

**Technical Details:**
- Uses `?modal=true` query parameter to trigger modal mode
- Implemented via `ModalProvider` context and layout detection
- Pages render normally in regular navigation, full-screen in modal mode

**Files:**
- `src/providers/ModalProvider.tsx` — Modal context provider
- `src/app/(app)/layout.tsx` — Modal detection and rendering

---

### 2. Health Data Import (Apple Health & Garmin)

Automatically import all your health data from Apple Health and Garmin devices.

**Supported Data:**
- **Apple Health**: Steps, calories burned, heart rate, sleep hours, nutrition data
- **Garmin**: Activities (workouts), daily summaries (steps, calories, heart rate, sleep)

**How to use:**

#### Apple Health Export
1. Open Health app on iPhone
2. Tap your profile icon (top right)
3. Select "Export Health Data"
4. Share the XML file
5. Go to Workouts page → "Import Data" button
6. Upload the XML file

#### Garmin Export
1. Visit [Garmin Connect](https://connect.garmin.com)
2. Go to Settings → Export Your Data
3. Download and extract the ZIP file
4. Go to Workouts page → "Import Data" button
5. Upload the ZIP file

**Imported Data:**
- Workouts appear in your workout history
- Health metrics (steps, heart rate, sleep, calories) are stored in the database
- All data is household-scoped for shared accountability

**Files:**
- `src/components/DataImport.tsx` — Upload UI component
- `src/app/api/import/health/route.ts` — File parsing and database insertion
- `packages/db/migrations/011_add_apple_health_source.sql` — Database schema update

---

### 3. Redesigned Budget Page

Comprehensive budget tracking with visual analytics, transaction review, and spending insights.

#### Dashboard View

**Safe to Spend**
- Displays your safe spending amount for the current month
- Calculated as: Income - Current Expenses
- Large, prominent gradient card at the top

**Monthly Metrics**
- **Income**: Total money in for the month
- **Fixed Spend**: Recurring expenses (estimated at 30% of total)
- **Savings**: Income minus expenses

**Spending Analytics**
- **Left Panel**: Category percentages (Needs, Wants, Savings)
- **Right Panel**: Actual spending amounts with progress bars
  - Needs (blue): Essential expenses
  - Wants (yellow): Discretionary spending
  - Savings (green): Money set aside

**Recent Transactions**
- 12 most recent transactions displayed in a grid
- Color-coded by category
- Shows merchant name, amount, and date
- Unreviewed transactions show a "Review N" button

**Accounts**
- List of connected bank accounts
- Display account name, type, and current balance
- Green dot indicates active account

#### Transaction Review Mode

**Accessing Review Mode:**
- Click "Review N" button when unreviewed transactions exist
- Navigate to next transaction with Skip button
- Go back with Undo button

**Categorizing Transactions:**
1. **Rate Emotion**: How did this purchase make you feel?
   - 😟 Regret (red)
   - 😐 Neutral (yellow)
   - 😊 Happy (green)

2. **Select Category**: Choose spending category
   - Needs: Essential expenses (groceries, utilities, insurance)
   - Wants: Discretionary spending (entertainment, dining out)
   - Savings: Money set aside for future goals

3. **Auto-advance**: System automatically moves to next transaction

**Progress Tracking:**
- Shows "1 of 26" style counter
- Undo button to go back one transaction
- Skip to move to next without categorizing

#### Database Schema

**New Fields Added:**
- `transactions.category` — TEXT, values: 'needs', 'wants', 'savings'
- `transactions.emotion` — TEXT, values: 'happy', 'neutral', 'sad'

**Migration:**
- `packages/db/migrations/012_add_transaction_categorization.sql`

**Files:**
- `src/app/(app)/budget/page.tsx` — Complete budget page with dashboard and review modes

---

## 📁 Project Structure

```
lifestyle_app/
├── apps/
│   └── web/              # Next.js application
│       ├── src/
│       │   ├── app/      # App router pages
│       │   ├── components/
│       │   ├── providers/ # React context providers
│       │   └── lib/      # Utilities and helpers
│       └── package.json
├── packages/
│   ├── db/               # Database migrations and types
│   ├── shared/           # Shared utilities (formatCurrency, etc.)
│   └── integrations/     # Third-party integrations
├── pnpm-workspace.yaml   # Monorepo configuration
└── README.md
```

---

## 🗄️ Database Schema

### Key Tables

**households**
- Represents a couple or household unit
- Stores shared settings and preferences

**health_metrics**
- Tracks daily health data (steps, calories, heart rate, sleep)
- Sources: 'garmin', 'bevel', 'manual', 'apple_health'
- Unique constraint: user_id + source + metric_date

**workout_sessions**
- Records workout sessions with exercises
- Tracks duration, exercises, and sets

**budget_accounts**
- Bank/financial accounts (checking, savings, credit, cash)
- Stores balances and account types

**transactions**
- Financial transactions (income and expenses)
- Categories: needs, wants, savings
- Emotion tracking: happy, neutral, sad

---

## 🛠️ Development

### Running Tests
```bash
pnpm test
```

### Type Checking
```bash
pnpm type-check
```

### Linting
```bash
pnpm lint
```

### Database Migrations
```bash
pnpm db:generate
```

---

## 🚢 Deployment

### Vercel Deployment

1. **Update Dependencies**
   ```bash
   pnpm install
   ```
   This updates `pnpm-lock.yaml` with any new dependencies.

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: describe your changes"
   git push
   ```

3. **Deploy**
   - Push to GitHub
   - Vercel automatically deploys on `main` branch

### Environment Variables

Required `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📱 Mobile Features

- Responsive design for all screen sizes
- Mobile tab bar navigation
- Touch-friendly buttons and inputs
- Optimized for small screens (workouts, budget, journal on mobile)

---

## 🔐 Security

- Row-level security (RLS) on all Supabase tables
- Household-scoped data access
- User authentication required
- No sensitive data stored in frontend

---

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Create a pull request

---

## 📝 Recent Changes

### v1.2.0 - Data Import & Budget Redesign
- ✅ Added full-screen modal pages for all sections
- ✅ Implemented Apple Health data import
- ✅ Implemented Garmin data import
- ✅ Redesigned budget page with analytics and transaction review
- ✅ Added transaction categorization (Needs/Wants/Savings)
- ✅ Added emotion tracking for spending insights

---

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**Built with ❤️ for couples who want to build their best life together.**
