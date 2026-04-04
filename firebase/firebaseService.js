import { db } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';

const EXPENSES_COLLECTION = 'expenses';
const BUDGETS_COLLECTION  = 'budgets';
const USER_DATA_DOC       = 'userData';

// ==================== EXPENSES ====================

export const saveExpensesToFirebase = async (expenses) => {
  try {
    const batch = writeBatch(db);

    // Delete all existing expense docs first
    const snapshot = await getDocs(collection(db, EXPENSES_COLLECTION));
    snapshot.forEach((d) => batch.delete(d.ref));

    // Write all current expenses — ✅ FIX: convert id to string
    expenses.forEach((expense) => {
      const expenseRef = doc(collection(db, EXPENSES_COLLECTION), String(expense.id));
      batch.set(expenseRef, { ...expense, id: String(expense.id) });
    });

    await batch.commit();
    console.log('✅ Expenses saved to Firebase:', expenses.length);
  } catch (error) {
    console.error('❌ Error saving expenses to Firebase:', error);
    throw error;
  }
};

export const loadExpensesFromFirebase = async () => {
  try {
    const snapshot = await getDocs(collection(db, EXPENSES_COLLECTION));
    const expenses = [];

    snapshot.forEach((d) => expenses.push(d.data()));

    console.log(`✅ Loaded ${expenses.length} expenses from Firebase`);
    return expenses;
  } catch (error) {
    console.error('❌ Error loading expenses from Firebase:', error);
    throw error;
  }
};

export const deleteExpensesFromFirebase = async (expenseIds) => {
  try {
    const batch = writeBatch(db);

    // ✅ FIX: convert each id to string
    expenseIds.forEach((id) => {
      const expenseRef = doc(db, EXPENSES_COLLECTION, String(id));
      batch.delete(expenseRef);
    });

    await batch.commit();
    console.log(`✅ Deleted ${expenseIds.length} expenses from Firebase`);
  } catch (error) {
    console.error('❌ Error deleting expenses from Firebase:', error);
    throw error;
  }
};

// ==================== BUDGETS ====================

export const saveBudgetsToFirebase = async (totalBudget, budgets) => {
  try {
    const budgetRef = doc(db, BUDGETS_COLLECTION, USER_DATA_DOC);
    await setDoc(budgetRef, {
      totalBudget,
      budgets,
      lastUpdated: new Date().toISOString(),
    });
    console.log('✅ Budgets saved to Firebase');
  } catch (error) {
    console.error('❌ Error saving budgets to Firebase:', error);
    throw error;
  }
};

export const loadBudgetsFromFirebase = async () => {
  try {
    const budgetRef  = doc(db, BUDGETS_COLLECTION, USER_DATA_DOC);
    const budgetSnap = await getDoc(budgetRef);

    if (budgetSnap.exists()) {
      const data = budgetSnap.data();
      console.log('✅ Budgets loaded from Firebase');
      return {
        totalBudget: data.totalBudget || 0,
        budgets:     data.budgets     || {},
      };
    }

    console.log('ℹ️ No budgets in Firebase, using defaults');
    return { totalBudget: 0, budgets: {} };
  } catch (error) {
    console.error('❌ Error loading budgets from Firebase:', error);
    throw error;
  }
};