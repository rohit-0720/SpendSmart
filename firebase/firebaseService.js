import { db } from './firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

// ==================== USER-SPECIFIC PATHS ====================
// Each user's data is stored under: users/{userId}/expenses and users/{userId}/budgets

const getUserExpensesCollection = (userId) => {
  if (!userId) throw new Error('userId is required');
  return collection(db, 'users', userId, 'expenses');
};

const getUserBudgetsDoc = (userId) => {
  if (!userId) throw new Error('userId is required');
  return doc(db, 'users', userId, 'budgets', 'userData');
};

// ==================== EXPENSES ====================

/**
 * Save all expenses to Firebase (user-specific)
 */
export const saveExpensesToFirebase = async (expenses, userId) => {
  if (!userId) {
    console.log('⚠️ No userId provided, skipping Firebase sync');
    return;
  }

  try {
    const batch = writeBatch(db);
    
    // Delete all existing expenses first
    const expensesCol = getUserExpensesCollection(userId);
    const expensesSnapshot = await getDocs(expensesCol);
    expensesSnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    
    // Add all current expenses
    expenses.forEach((expense) => {
      const expenseRef = doc(expensesCol, String(expense.id));
      batch.set(expenseRef, expense);
    });
    
    await batch.commit();
    console.log(`✅ ${expenses.length} expenses saved to Firebase (user: ${userId})`);
  } catch (error) {
    console.error('❌ Error saving expenses to Firebase:', error);
    throw error;
  }
};

/**
 * Load all expenses from Firebase (user-specific)
 */
export const loadExpensesFromFirebase = async (userId) => {
  if (!userId) {
    console.log('⚠️ No userId provided, returning empty expenses');
    return [];
  }

  try {
    const expensesCol = getUserExpensesCollection(userId);
    const expensesSnapshot = await getDocs(expensesCol);
    const expenses = [];
    
    expensesSnapshot.forEach((docSnap) => {
      expenses.push(docSnap.data());
    });
    
    console.log(`✅ Loaded ${expenses.length} expenses from Firebase (user: ${userId})`);
    return expenses;
  } catch (error) {
    console.error('❌ Error loading expenses from Firebase:', error);
    throw error;
  }
};

// ==================== BUDGETS ====================

/**
 * Save budgets to Firebase (user-specific)
 */
export const saveBudgetsToFirebase = async (totalBudget, budgets, userId) => {
  if (!userId) {
    console.log('⚠️ No userId provided, skipping Firebase sync');
    return;
  }

  try {
    const budgetData = {
      totalBudget,
      budgets,
      lastUpdated: new Date().toISOString()
    };
    
    const budgetRef = getUserBudgetsDoc(userId);
    await setDoc(budgetRef, budgetData);
    
    console.log(`✅ Budgets saved to Firebase (user: ${userId})`);
  } catch (error) {
    console.error('❌ Error saving budgets to Firebase:', error);
    throw error;
  }
};

/**
 * Load budgets from Firebase (user-specific)
 */
export const loadBudgetsFromFirebase = async (userId) => {
  if (!userId) {
    console.log('⚠️ No userId provided, returning default budgets');
    return {
      totalBudget: 0,
      budgets: []
    };
  }

  try {
    const budgetRef = getUserBudgetsDoc(userId);
    const budgetSnap = await getDoc(budgetRef);
    
    if (budgetSnap.exists()) {
      const data = budgetSnap.data();
      console.log(`✅ Budgets loaded from Firebase (user: ${userId})`);
      return {
        totalBudget: data.totalBudget || 0,
        budgets: data.budgets || []
      };
    } else {
      console.log('ℹ️ No budgets found in Firebase for this user, using defaults');
      return {
        totalBudget: 0,
        budgets: []
      };
    }
  } catch (error) {
    console.error('❌ Error loading budgets from Firebase:', error);
    throw error;
  }
};