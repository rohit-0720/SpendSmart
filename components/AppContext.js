import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveExpensesToFirebase,
  loadExpensesFromFirebase,
  saveBudgetsToFirebase,
  loadBudgetsFromFirebase,
} from '../firebase/firebaseService';

// ==================== CONTEXT ====================
const AppContext = createContext();
export const useApp = () => useContext(AppContext); // ✅ FIX 5: re-added missing hook

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
  const [totalBudget, setTotalBudget] = useState(0);
const [budgets, setBudgets] = useState([
  { name: 'Food & Dining', budget: 0, emoji: '🍔', color: '#F59E0B', locked: false },
  { name: 'Transport',     budget: 0, emoji: '🚌', color: '#6C63FF', locked: false },
  { name: 'Shopping',      budget: 0, emoji: '🛍', color: '#10B981', locked: false },
  { name: 'Rent & Bills',  budget: 0, emoji: '💡', color: '#3ECFCF', locked: false },
  { name: 'Entertainment', budget: 0, emoji: '🎬', color: '#EC4899', locked: false },
  { name: 'Health',        budget: 0, emoji: '💊', color: '#EF4444', locked: false },
]);
  const [expenses, setExpenses]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ==================== LOAD DATA ON START ====================
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      // Try Firebase first
      try {
        const [firebaseExpenses, firebaseBudgets] = await Promise.all([
          loadExpensesFromFirebase(),
          loadBudgetsFromFirebase(),
        ]);

        setExpenses(sortByDate(firebaseExpenses));
        setTotalBudget(firebaseBudgets.totalBudget || 0);
        setBudgets(firebaseBudgets.budgets || {});

        console.log('✅ Data loaded from Firebase');
      } catch (firebaseError) {
        console.log('⚠️ Firebase failed, falling back to AsyncStorage...', firebaseError.message);

        // Fallback to AsyncStorage
        const [localExpenses, localTotal, localBudgets] = await Promise.all([
          AsyncStorage.getItem('expenses'),
          AsyncStorage.getItem('totalBudget'),
          AsyncStorage.getItem('budgets'),
        ]);

        if (localExpenses) setExpenses(sortByDate(JSON.parse(localExpenses)));
        if (localTotal)    setTotalBudget(JSON.parse(localTotal));
        if (localBudgets)  setBudgets(JSON.parse(localBudgets));

        console.log('✅ Data loaded from AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== SYNC HELPERS ====================
  const syncExpenses = async (updatedExpenses) => {
    try {
      await AsyncStorage.setItem('expenses', JSON.stringify(updatedExpenses));
      try {
        await saveExpensesToFirebase(updatedExpenses);
      } catch {
        console.log('⚠️ Firebase expense sync failed (offline?), saved locally');
      }
    } catch (error) {
      console.error('❌ Error syncing expenses:', error);
    }
  };

  const syncBudgets = async (newTotal, newBudgets) => {
    try {
      await AsyncStorage.setItem('totalBudget', JSON.stringify(newTotal));
      await AsyncStorage.setItem('budgets', JSON.stringify(newBudgets));
      try {
        await saveBudgetsToFirebase(newTotal, newBudgets);
      } catch {
        console.log('⚠️ Firebase budget sync failed (offline?), saved locally');
      }
    } catch (error) {
      console.error('❌ Error syncing budgets:', error);
    }
  };

  // ==================== ADD EXPENSE ====================
  // ✅ FIX 3: restored id assignment, amount parsing, and sort
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
  // ✅ FIX 4: removed redundant deleteExpensesFromFirebase call
  //           syncExpenses already saves the updated list to both storages
  const deleteExpenses = (ids) => {
    setExpenses(prev => {
      const updated = prev.filter(e => !ids.includes(e.id));
      syncExpenses(updated);
      return updated;
    });
  };

  // ==================== SAVE BUDGETS ====================
  // ✅ FIX 6: restored original signature — accepts (newTotal, newCategoriesArray)
  //           where newCategoriesArray is [{name, budget}, ...] from BudgetScreen
 const saveBudgets = (newTotal, newCategoriesArray) => {
  const safeTotal = newTotal || 0;
  const newBudgets = (newCategoriesArray || []).map(c => ({
    name:   c.name   || '',
    budget: c.budget || 0,
    emoji:  c.emoji  || '⭐',
    color:  c.color  || '#6C63FF',
    locked: c.locked || false, // ✅ persist lock state
  }));

  setTotalBudget(safeTotal);
  setBudgets(newBudgets);
  syncBudgets(safeTotal, newBudgets);
};

  // ==================== GET SPENT BY CATEGORY ====================
  // ✅ FIX 1: restored monthYear filter — accepts optional {month, year} object
  //           if no monthYear passed, returns all-time totals (used by Dashboard)
const getSpentByCategory = (monthYear) => {
  const spent = {};
  // budgets is now an array
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
  // ✅ FIX 2: restored original {month, year} object signature
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