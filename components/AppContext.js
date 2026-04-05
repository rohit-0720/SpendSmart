import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  saveExpensesToFirebase,
  loadExpensesFromFirebase,
  saveBudgetsToFirebase,
  loadBudgetsFromFirebase,
} from '../firebase/firebaseService';

// ==================== CONTEXT ====================
const AppContext = createContext();
export const useApp = () => useContext(AppContext);

// ==================== HELPERS ====================
const sortByDate = (list) => {
  return [...list].sort((a, b) => {
    const diff = new Date(b.fullDate) - new Date(a.fullDate);
    if (diff !== 0) return diff;
    return b.id - a.id;
  });
};

// ==================== PROVIDER ====================
export function AppProvider({ children }) {
  const { user } = useAuth(); // ✅ Get current user from AuthContext
  
  const [totalBudget, setTotalBudget] = useState(0);
  const [budgets, setBudgets] = useState([
    { name: 'Food & Dining', budget: 0, emoji: '🍔', color: '#F59E0B', locked: false },
    { name: 'Transport',     budget: 0, emoji: '🚌', color: '#6C63FF', locked: false },
    { name: 'Shopping',      budget: 0, emoji: '🛍', color: '#10B981', locked: false },
    { name: 'Rent & Bills',  budget: 0, emoji: '💡', color: '#3ECFCF', locked: false },
    { name: 'Entertainment', budget: 0, emoji: '🎬', color: '#EC4899', locked: false },
    { name: 'Health',        budget: 0, emoji: '💊', color: '#EF4444', locked: false },
  ]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ==================== LOAD DATA WHEN USER CHANGES ====================
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // User logged out - reset to defaults
      setExpenses([]);
      setTotalBudget(0);
      setBudgets([
        { name: 'Food & Dining', budget: 0, emoji: '🍔', color: '#F59E0B', locked: false },
        { name: 'Transport',     budget: 0, emoji: '🚌', color: '#6C63FF', locked: false },
        { name: 'Shopping',      budget: 0, emoji: '🛍', color: '#10B981', locked: false },
        { name: 'Rent & Bills',  budget: 0, emoji: '💡', color: '#3ECFCF', locked: false },
        { name: 'Entertainment', budget: 0, emoji: '🎬', color: '#EC4899', locked: false },
        { name: 'Health',        budget: 0, emoji: '💊', color: '#EF4444', locked: false },
      ]);
      setIsLoading(false);
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      // Load from Firebase (user-specific data)
      const [firebaseExpenses, firebaseBudgets] = await Promise.all([
        loadExpensesFromFirebase(user.uid),
        loadBudgetsFromFirebase(user.uid),
      ]);

      setExpenses(sortByDate(firebaseExpenses));
      setTotalBudget(firebaseBudgets.totalBudget || 0);
      
      // Handle budgets being either array or object (for backwards compatibility)
      if (Array.isArray(firebaseBudgets.budgets) && firebaseBudgets.budgets.length > 0) {
        setBudgets(firebaseBudgets.budgets);
      } else if (firebaseBudgets.budgets && typeof firebaseBudgets.budgets === 'object') {
        // Convert old object format to array
        const budgetArray = Object.entries(firebaseBudgets.budgets).map(([name, budget]) => ({
          name,
          budget,
          emoji: '⭐',
          color: '#6C63FF',
          locked: false
        }));
        setBudgets(budgetArray);
      }

      console.log('✅ Data loaded from Firebase for user:', user.email);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== SYNC HELPERS ====================
  const syncExpenses = async (updatedExpenses) => {
    if (!user) return;
    
    try {
      await saveExpensesToFirebase(updatedExpenses, user.uid);
      console.log('✅ Expenses synced to Firebase');
    } catch (error) {
      console.error('⚠️ Firebase expense sync failed:', error.message);
    }
  };

  const syncBudgets = async (newTotal, newBudgets) => {
    if (!user) return;
    
    try {
      await saveBudgetsToFirebase(newTotal, newBudgets, user.uid);
      console.log('✅ Budgets synced to Firebase');
    } catch (error) {
      console.error('⚠️ Firebase budget sync failed:', error.message);
    }
  };

  // ==================== ADD EXPENSE ====================
  const addExpense = (expense) => {
    const safeAmount = parseFloat(expense.amount);
    if (isNaN(safeAmount)) return;

    setExpenses(prev => {
      const updated = sortByDate([
        { ...expense, amount: safeAmount, id: Date.now() },
        ...prev,
      ]);
      syncExpenses(updated);
      return updated;
    });
  };

  // ==================== DELETE EXPENSES ====================
  const deleteExpenses = (ids) => {
    setExpenses(prev => {
      const updated = prev.filter(e => !ids.includes(e.id));
      syncExpenses(updated);
      return updated;
    });
  };

  // ==================== SAVE BUDGETS ====================
  const saveBudgets = (newTotal, newCategoriesArray) => {
    const safeTotal = newTotal || 0;
    const newBudgets = (newCategoriesArray || []).map(c => ({
      name:   c.name   || '',
      budget: c.budget || 0,
      emoji:  c.emoji  || '⭐',
      color:  c.color  || '#6C63FF',
      locked: c.locked || false,
    }));

    setTotalBudget(safeTotal);
    setBudgets(newBudgets);
    syncBudgets(safeTotal, newBudgets);
  };

  // ==================== GET SPENT BY CATEGORY ====================
  const getSpentByCategory = (monthYear) => {
    const spent = {};
    const budgetList = Array.isArray(budgets) ? budgets : Object.keys(budgets).map(name => ({ name }));
    budgetList.forEach(cat => { spent[cat.name] = 0; });

    (expenses || [])
      .filter(exp => {
        if (!monthYear) return true;
        const d = new Date(exp.fullDate);
        return d.getMonth() === monthYear.month && d.getFullYear() === monthYear.year;
      })
      .forEach(exp => {
        if (spent[exp.category] !== undefined) {
          spent[exp.category] += exp.amount || 0;
        }
      });

    return spent;
  };

  // ==================== GET EXPENSES BY MONTH ====================
  const getExpensesByMonth = (monthYear) => {
    return (expenses || []).filter(exp => {
      const d = new Date(exp.fullDate);
      return d.getMonth() === monthYear.month && d.getFullYear() === monthYear.year;
    });
  };

  // ==================== CONTEXT VALUE ====================
  return (
    <AppContext.Provider value={{
      totalBudget,
      budgets,
      expenses,
      isLoading,
      addExpense,
      deleteExpenses,
      saveBudgets,
      getSpentByCategory,
      getExpensesByMonth,
    }}>
      {children}
    </AppContext.Provider>
  );
}