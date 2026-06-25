export function caloriesToMacroGrams(calories: number, proteinPct: number, carbsPct: number, fatPct: number) {
  return {
    protein_g: Math.round((calories * proteinPct) / 400),  // 4 cal/g
    carbs_g: Math.round((calories * carbsPct) / 400),       // 4 cal/g
    fat_g: Math.round((calories * fatPct) / 900),           // 9 cal/g
  }
}

export function macrosToCalories(protein_g: number, carbs_g: number, fat_g: number): number {
  return Math.round(protein_g * 4 + carbs_g * 4 + fat_g * 9)
}

// Mifflin-St Jeor TDEE estimate
export function estimateTDEE(opts: {
  weightKg: number
  heightCm: number
  ageYears: number
  sex: 'male' | 'female'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
}): number {
  const bmr =
    opts.sex === 'male'
      ? 10 * opts.weightKg + 6.25 * opts.heightCm - 5 * opts.ageYears + 5
      : 10 * opts.weightKg + 6.25 * opts.heightCm - 5 * opts.ageYears - 161

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }
  return Math.round(bmr * multipliers[opts.activityLevel])
}

export function macroPercentage(macroGrams: number, caloriesPerGram: number, totalCalories: number): number {
  if (totalCalories === 0) return 0
  return Math.round((macroGrams * caloriesPerGram / totalCalories) * 100)
}
