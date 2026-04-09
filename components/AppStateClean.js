import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  saveExpensesToFirebase,
  loadExpensesFromFirebase,
  saveBudgetsToFirebase,
  loadBudgetsFromFirebase,
} from '../firebase/firebaseService';

const DEFAULT_BUDGETS = [
  { name: 'Food & Dining', budget: 0, emoji: '\u{1F354}', icon: 'fast-food-outline', color: '#F59E0B', locked: false },
  { name: 'Transport', budget: 0, emoji: '\u{1F68C}', icon: 'car-outline', color: '#6C63FF', locked: false },
  { name: 'Shopping', budget: 0, emoji: '\u{1F6CD}', icon: 'bag-handle-outline', color: '#10B981', locked: false },
  { name: 'Rent & Bills', budget: 0, emoji: '\u{1F4A1}', icon: 'flash-outline', color: '#3ECFCF', locked: false },
  { name: 'Entertainment', budget: 0, emoji: '\u{1F3AC}', icon: 'film-outline', color: '#EC4899', locked: false },
  { name: 'Health', budget: 0, emoji: '\u{1F48A}', icon: 'medkit-outline', color: '#EF4444', locked: false },
];

const AppStateContext = createContext();

export const useApp = () => useContext(AppStateContext);
export const getDefaultBudgets = () => DEFAULT_BUDGETS.map((item) => ({ ...item }));

const sortByDate = (list) => {
  return [...list].sort((a, b) => {
    const diff = new Date(b.fullDate) - new Date(a.fullDate);
    if (diff !== 0) return diff;
    return b.id - a.id;
  });
};

const normalizeBudgetArray = (rawBudgets) => {
  if (Array.isArray(rawBudgets) && rawBudgets.length > 0) {
    return rawBudgets.map((item) => ({
      ...item,
      emoji: item.emoji || DEFAULT_BUDGETS.find((entry) => entry.name === item.name)?.emoji || '\u2753',
      icon: item.icon || DEFAULT_BUDGETS.find((entry) => entry.name === item.name)?.icon || 'pricetag-outline',
      color: item.color || DEFAULT_BUDGETS.find((entry) => entry.name === item.name)?.color || '#6C63FF',
      locked: !!item.locked,
    }));
  }

  if (rawBudgets && typeof rawBudgets === 'object') {
    return Object.entries(rawBudgets).map(([name, value]) => {
      const defaults = DEFAULT_BUDGETS.find((entry) => entry.name === name);
      const isObjectValue = value && typeof value === 'object';

      return {
        name,
        budget: isObjectValue ? value.budget || 0 : value || 0,
        emoji: isObjectValue ? value.emoji || defaults?.emoji || '\u2753' : defaults?.emoji || '\u2753',
        icon: isObjectValue ? value.icon || defaults?.icon || 'pricetag-outline' : defaults?.icon || 'pricetag-outline',
        color: isObjectValue ? value.color || defaults?.color || '#6C63FF' : defaults?.color || '#6C63FF',
        locked: isObjectValue ? !!value.locked : false,
      };
    });
  }

  return getDefaultBudgets();
};

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [totalBudget, setTotalBudget] = useState(0);
  const [budgets, setBudgets] = useState(getDefaultBudgets());
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAllData();
      return;
    }

    setExpenses([]);
    setTotalBudget(0);
    setBudgets(getDefaultBudgets());
    setIsLoading(false);
  }, [user]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [firebaseExpenses, firebaseBudgets] = await Promise.all([
        loadExpensesFromFirebase(user.uid),
        loadBudgetsFromFirebase(user.uid),
      ]);
      setExpenses(sortByDate(firebaseExpenses));
      setTotalBudget(firebaseBudgets.totalBudget || 0);
      setBudgets(normalizeBudgetArray(firebaseBudgets.budgets));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncExpenses = async (updatedExpenses) => {
    if (!user) return;
    try {
      await saveExpensesToFirebase(updatedExpenses, user.uid);
    } catch (error) {
      console.error('Firebase expense sync failed:', error.message);
    }
  };

  const syncBudgets = async (newTotal, newBudgets) => {
    if (!user) return;
    try {
      await saveBudgetsToFirebase(newTotal, newBudgets, user.uid);
    } catch (error) {
      console.error('Firebase budget sync failed:', error.message);
    }
  };

  const addExpense = (expense) => {
    const safeAmount = parseFloat(expense.amount);
    if (isNaN(safeAmount)) return;

    setExpenses((prev) => {
      const updated = sortByDate([{ ...expense, amount: safeAmount, id: Date.now() }, ...prev]);
      syncExpenses(updated);
      return updated;
    });
  };

  const deleteExpenses = (ids) => {
    setExpenses((prev) => {
      const updated = prev.filter((expense) => !ids.includes(expense.id));
      syncExpenses(updated);
      return updated;
    });
  };

  const saveBudgets = (newTotal, newCategoriesArray) => {
    const safeTotal = newTotal || 0;
    const newBudgets = (newCategoriesArray || []).map((item) => ({
      name: item.name || '',
      budget: item.budget || 0,
      emoji: item.emoji || '\u2753',
      icon: item.icon || 'pricetag-outline',
      color: item.color || '#6C63FF',
      locked: !!item.locked,
    }));

    setTotalBudget(safeTotal);
    setBudgets(newBudgets);
    syncBudgets(safeTotal, newBudgets);
  };

  const getSpentByCategory = (monthYear) => {
    const spent = {};
    budgets.forEach((category) => {
      spent[category.name] = 0;
    });

    expenses
      .filter((expense) => {
        if (!monthYear) return true;
        const date = new Date(expense.fullDate);
        return date.getMonth() === monthYear.month && date.getFullYear() === monthYear.year;
      })
      .forEach((expense) => {
        if (spent[expense.category] !== undefined) {
          spent[expense.category] += expense.amount || 0;
        }
      });

    return spent;
  };

  const getExpensesByMonth = (monthYear) => {
    return expenses.filter((expense) => {
      const date = new Date(expense.fullDate);
      return date.getMonth() === monthYear.month && date.getFullYear() === monthYear.year;
    });
  };

  const hasSavedBudget = totalBudget > 0 && budgets.some((item) => (item.budget || 0) > 0);

  return (
    <AppStateContext.Provider
      value={{
        totalBudget,
        budgets,
        expenses,
        isLoading,
        hasSavedBudget,
        addExpense,
        deleteExpenses,
        saveBudgets,
        getSpentByCategory,
        getExpensesByMonth,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}
