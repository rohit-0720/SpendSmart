import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

const initialBudgets = {
  'Food & Dining':  6000,
  'Transport':      3000,
  'Shopping':       4000,
  'Rent & Bills':   7000,
  'Entertainment':  2000,
  'Health':         3000,
};

const now = new Date();
const thisMonth = now.toISOString();
const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString();

const initialExpenses = [
  { id: 1, name: "Domino's Pizza",   category: 'Food & Dining', amount: 520,  emoji: '🍕', date: 'Today',     fullDate: thisMonth },
  { id: 2, name: 'Metro Card',       category: 'Transport',     amount: 200,  emoji: '🚇', date: 'Yesterday', fullDate: thisMonth },
  { id: 3, name: 'Nike Shoes',       category: 'Shopping',      amount: 2499, emoji: '👟', date: 'Mar 25',    fullDate: thisMonth },
  { id: 4, name: 'Café Coffee Day',  category: 'Food & Dining', amount: 340,  emoji: '☕', date: 'Mar 24',    fullDate: thisMonth },
  { id: 5, name: 'Netflix',          category: 'Entertainment', amount: 649,  emoji: '🎬', date: 'Mar 23',    fullDate: thisMonth },
  { id: 6, name: 'Electricity Bill', category: 'Rent & Bills',  amount: 1400, emoji: '💡', date: 'Feb 28',    fullDate: lastMonth },
  { id: 7, name: 'Gym Membership',   category: 'Health',        amount: 1200, emoji: '💪', date: 'Feb 15',    fullDate: lastMonth },
  { id: 8, name: 'Zomato Order',     category: 'Food & Dining', amount: 480,  emoji: '🍔', date: 'Feb 10',    fullDate: lastMonth },
];

export function AppProvider({ children }) {
  const [totalBudget, setTotalBudget] = useState(25000);
  const [budgets, setBudgets]         = useState(initialBudgets);
  const [expenses, setExpenses]       = useState(initialExpenses);

  const addExpense = (expense) => {
    setExpenses(prev => [{ ...expense, id: Date.now() }, ...prev]);
  };

  const deleteExpenses = (ids) => {
    setExpenses(prev => prev.filter(e => !ids.includes(e.id)));
  };

  const saveBudgets = (newTotal, newCategories) => {
    setTotalBudget(newTotal);
    const newBudgets = {};
    newCategories.forEach(c => { newBudgets[c.name] = c.budget; });
    setBudgets(newBudgets);
  };

  const getSpentByCategory = (monthYear) => {
    const spent = {};
    Object.keys(initialBudgets).forEach(cat => { spent[cat] = 0; });
    expenses
      .filter(exp => {
        if (!monthYear) return true;
        const d = new Date(exp.fullDate);
        return d.getMonth() === monthYear.month && d.getFullYear() === monthYear.year;
      })
      .forEach(exp => {
        if (spent[exp.category] !== undefined) {
          spent[exp.category] += exp.amount;
        }
      });
    return spent;
  };

  const getExpensesByMonth = (monthYear) => {
    return expenses.filter(exp => {
      const d = new Date(exp.fullDate);
      return d.getMonth() === monthYear.month && d.getFullYear() === monthYear.year;
    });
  };

  return (
    <AppContext.Provider value={{
      totalBudget,
      budgets,
      expenses,
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