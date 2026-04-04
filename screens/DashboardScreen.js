import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../components/AppContext';

export default function DashboardScreen({ onViewAll }) {
  const { totalBudget, budgets, expenses, getSpentByCategory } = useApp();
  const spentByCategory = getSpentByCategory();
  const totalSpent = Object.values(spentByCategory).reduce((s, v) => s + v, 0);
  const safeTotalBudget = totalBudget || 0;
  const percentage = safeTotalBudget > 0
    ? Math.min(Math.round((totalSpent / safeTotalBudget) * 100), 100)
    : 0;

  // ✅ normalize budgets — handles both array and old object format
  const categoryList = Array.isArray(budgets)
    ? budgets
    : Object.entries(budgets).map(([name, val]) => ({
        name,
        budget: typeof val === 'object' ? val.budget : val,
        emoji:  typeof val === 'object' ? val.emoji  : '❓',
        color:  typeof val === 'object' ? val.color  : '#999',
      }));

  return (
    <ScrollView style={styles.container}>

      {/* Budget Overview Card */}
      <View style={styles.budgetCard}>
        <Text style={styles.budgetLabel}>Total Spent</Text>
        <Text style={styles.budgetAmount}>₹{(totalSpent || 0).toLocaleString('en-IN')}</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Budget: ₹{safeTotalBudget.toLocaleString('en-IN')}</Text>
          <Text style={styles.progressText}>{percentage}% used</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill,
            { width: `${percentage}%`, backgroundColor: percentage > 80 ? '#EF4444' : '#6C63FF' }
          ]} />
        </View>
      </View>

      {/* Category Cards */}
      <Text style={styles.sectionTitle}>Spending by Category</Text>
      <View style={styles.categoryGrid}>
        {categoryList.map((cat) => {
          const spent  = spentByCategory[cat.name] || 0;
          const budget = cat.budget || 0;
          const pct    = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;

          return (
            <View key={cat.name} style={styles.categoryCard}>
              <Text style={styles.categoryEmoji}>{cat.emoji || '❓'}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryAmount}>₹{spent.toLocaleString('en-IN')}</Text>
              <Text style={styles.categoryBudget}>of ₹{budget.toLocaleString('en-IN')}</Text>
              <View style={styles.catBarBg}>
                <View style={[styles.catBarFill, {
                  width: `${pct}%`,
                  backgroundColor: pct >= 100 ? '#EF4444' : (cat.color || '#6C63FF'),
                }]} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Recent Transactions Header */}
      <View style={styles.txnHeader}>
        <Text style={styles.sectionTitle2}>Recent Transactions</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllBtn}>View All ›</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <View style={styles.txnCard}>
        {expenses.slice(0, 5).map((txn) => (
          <View key={txn.id} style={[styles.txnRow, { borderBottomWidth: 0.5, borderBottomColor: '#eee' }]}>
            <Text style={styles.txnEmoji}>{txn.emoji}</Text>
            <View style={styles.txnInfo}>
              <Text style={styles.txnName}>{txn.name}</Text>
              <Text style={styles.txnCategory}>{txn.category}</Text>
            </View>
            <View>
              <Text style={styles.txnAmount}>−₹{txn.amount.toLocaleString('en-IN')}</Text>
              <Text style={styles.txnDate}>{txn.date}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F5F5F5' },
  budgetCard:      { backgroundColor: '#1a1a2e', margin: 16, borderRadius: 16, padding: 20 },
  budgetLabel:     { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 },
  budgetAmount:    { color: '#fff', fontSize: 32, fontWeight: '600', marginBottom: 12 },
  progressRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText:    { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  progressBarBg:   { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, height: 8 },
  progressBarFill: { height: 8, borderRadius: 99 },
  sectionTitle:    { fontSize: 16, fontWeight: '600', marginHorizontal: 16, marginBottom: 10, marginTop: 8, color: '#1a1a2e' },
  txnHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 10 },
  sectionTitle2:   { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  viewAllBtn:      { color: '#6C63FF', fontSize: 13, fontWeight: '600' },
  categoryGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  categoryCard:    { backgroundColor: '#fff', borderRadius: 14, padding: 14, margin: 6, width: '44%' },
  categoryEmoji:   { fontSize: 24, marginBottom: 6 },
  categoryName:    { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 4 },
  categoryAmount:  { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  categoryBudget:  { fontSize: 11, color: '#888', marginBottom: 6 },
  catBarBg:        { backgroundColor: '#eee', borderRadius: 99, height: 4 },
  catBarFill:      { height: 4, borderRadius: 99 },
  txnCard:         { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, overflow: 'hidden' },
  txnRow:          { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  txnEmoji:        { fontSize: 24, width: 40, textAlign: 'center' },
  txnInfo:         { flex: 1 },
  txnName:         { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  txnCategory:     { fontSize: 12, color: '#888', marginTop: 2 },
  txnAmount:       { fontSize: 14, fontWeight: '600', color: '#1a1a2e', textAlign: 'right' },
  txnDate:         { fontSize: 11, color: '#888', textAlign: 'right', marginTop: 2 },
});