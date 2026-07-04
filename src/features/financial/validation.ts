// Lightweight, Custom Input Validation for PFM Ledger

export const validateAccount = (
  name: string,
  type: string,
  currency: string,
  openingBalance: number
): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Account name is required.'
  }
  if (name.length > 50) {
    return 'Account name must be under 50 characters.'
  }

  const validTypes = ['cash', 'checking', 'savings', 'credit_card', 'loan', 'investment', 'other']
  if (!validTypes.includes(type)) {
    return 'Invalid account type.'
  }

  if (!currency || currency.trim().length !== 3) {
    return 'Currency code must be exactly 3 characters (e.g. INR, USD).'
  }

  if (isNaN(openingBalance)) {
    return 'Opening balance must be a valid number.'
  }

  return null
}

export const validateTransaction = (
  amount: number,
  date: string,
  accountId: string,
  type: string,
  categoryId: string | null,
  transferToAccountId: string | null
): string | null => {
  if (isNaN(amount) || amount <= 0) {
    return 'Amount must be greater than zero.'
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return 'Please enter a valid date in YYYY-MM-DD format.'
  }

  if (!accountId) {
    return 'Source account is required.'
  }

  const validTypes = ['income', 'expense', 'transfer']
  if (!validTypes.includes(type)) {
    return 'Invalid transaction type.'
  }

  if (type === 'transfer') {
    if (!transferToAccountId) {
      return 'Destination account is required for transfers.'
    }
    if (accountId === transferToAccountId) {
      return 'Source and destination accounts must be different.'
    }
    if (categoryId) {
      return 'Transfers cannot have a category.'
    }
  } else {
    if (transferToAccountId) {
      return 'Only transfers can have a destination account.'
    }
  }

  return null
}

export const validateTag = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Tag name is required.'
  }
  if (name.length > 20) {
    return 'Tag name must be under 20 characters.'
  }
  if (!/^[a-zA-Z0-9\s-_]+$/.test(name)) {
    return 'Tag name must contain only letters, numbers, spaces, hyphens, or underscores.'
  }
  return null
}

export const validateGoal = (
  name: string,
  targetAmount: number,
  startDate: string,
  targetDate: string,
  type: string
): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Goal name is required.'
  }

  if (isNaN(targetAmount) || targetAmount <= 0) {
    return 'Target amount must be greater than zero.'
  }

  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return 'Start date must be in YYYY-MM-DD format.'
  }

  if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return 'Target date must be in YYYY-MM-DD format.'
  }

  if (targetDate < startDate) {
    return 'Target date must be equal to or after the start date.'
  }

  const validTypes = ['monthly_savings', 'financial_year', 'personal']
  if (!validTypes.includes(type)) {
    return 'Invalid goal type.'
  }

  return null
}

export const validateGoalContribution = (amount: number, date: string): string | null => {
  if (isNaN(amount) || amount <= 0) {
    return 'Contribution amount must be greater than zero.'
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return 'Contribution date must be in YYYY-MM-DD format.'
  }

  return null
}
