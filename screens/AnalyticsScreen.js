import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useApp } from '../components/AppContext';

const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      month: d.getMonth(),
      year:  d.getFullYear(),
    });
  }
  return options;
};

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AnalyticsScreen() {
  const { budgets, totalBudget, getSpentByCategory, getExpensesByMonth } = useApp();
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);

  const spentByCategory = getSpentByCategory(selectedMonth);
  const monthExpenses   = getExpensesByMonth(selectedMonth);
  const totalSpent      = Object.values(spentByCategory).reduce((s, v) => s + v, 0);
  const totalRemaining  = Math.max(totalBudget - totalSpent, 0);

  // ✅ normalize budgets — handles both array and old object format
  const categoryList = Array.isArray(budgets)
    ? budgets
    : Object.entries(budgets).map(([name, val]) => ({
        name,
        budget: typeof val === 'object' ? val.budget : val,
        emoji:  typeof val === 'object' ? val.emoji  : '❓',
        color:  typeof val === 'object' ? val.color  : '#6C63FF',
      }));

  // Weekly bar chart
  const weeklyData = days.map((day, i) => {
    const total = monthExpenses
      .filter(exp => new Date(exp.fullDate).getDay() === i)
      .reduce((s, exp) => s + exp.amount, 0);
    return { day, amount: total };
  });

  const maxAmount = Math.max(...weeklyData.map(d => d.amount), 1);
  const avgAmount = weeklyData.filter(d => d.amount > 0).length > 0
    ? Math.round(totalSpent / weeklyData.filter(d => d.amount > 0).length)
    : 0;

  return (
    <ScrollView style={styles.container}>

      {/* Month Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
        {monthOptions.map(m => (
          <TouchableOpacity
            key={m.label}
            style={[styles.periodBtn, selectedMonth.label === m.label && styles.periodBtnActive]}
            onPress={() => setSelectedMonth(m)}
          >
            <Text style={[styles.periodText, selectedMonth.label === m.label && styles.periodTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryValue}>₹{totalSpent.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Daily Average</Text>
          <Text style={styles.summaryValue}>₹{avgAmount.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>₹{totalRemaining.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Weekly Bar Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Spending by Day of Week</Text>
        <View style={styles.chartArea}>
          {weeklyData.map((d) => {
            const heightPct = (d.amount / maxAmount) * 100;
            const isOver    = d.amount > avgAmount && d.amount > 0;
            return (
              <View key={d.day} style={styles.barCol}>
                <Text style={styles.barAmount}>
                  {d.amount > 0 ? `₹${d.amount >= 1000 ? (d.amount / 1000).toFixed(1) + 'k' : d.amount}` : ''}
                </Text>
                <View style={styles.barBg}>
                  <View style={[
                    styles.barFill,
                    { height: `${Math.max(heightPct, d.amount > 0 ? 5 : 0)}%`, backgroundColor: isOver ? '#EF4444' : '#6C63FF' }
                  ]} />
                </View>
                <Text style={styles.barDay}>{d.day}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.chartNote}>Red bars = above daily average (₹{avgAmount})</Text>
      </View>

      {/* Category Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Category Breakdown</Text>
        {categoryList.map((cat) => {
          const spent  = spentByCategory[cat.name] || 0;
          const budget = cat.budget || 0;
          const pct    = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
          const isOver = spent > budget && budget > 0;
          return (
            <View key={cat.name} style={styles.catRow}>
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <View style={styles.catInfo}>
                <View style={styles.catTopRow}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={[styles.catPct, isOver && { color: '#EF4444' }]}>
                    {isOver ? '⚠ Over!' : `${pct}%`}
                  </Text>
                </View>
                <View style={styles.catBarBg}>
                  <View style={[styles.catBarFill, {
                    width: `${pct}%`,
                    backgroundColor: isOver ? '#EF4444' : (cat.color || '#6C63FF'),
                  }]} />
                </View>
                <Text style={styles.catAmounts}>
                  ₹{spent.toLocaleString('en-IN')} of ₹{budget.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Insight Card */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>📊 Smart Insight</Text>
        <Text style={styles.insightText}>
          {totalSpent === 0
            ? `No expenses recorded for ${selectedMonth.label} yet.`
            : totalSpent > totalBudget
            ? `You have exceeded your ₹${totalBudget.toLocaleString('en-IN')} budget by ₹${(totalSpent - totalBudget).toLocaleString('en-IN')} this month.`
            : `You have spent ₹${totalSpent.toLocaleString('en-IN')} of your ₹${totalBudget.toLocaleString('en-IN')} budget. ₹${totalRemaining.toLocaleString('en-IN')} remaining for ${selectedMonth.label}.`
          }
        </Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5F5F5' },
  periodRow:        { flexDirection: 'row', margin: 16, gap: 8 },
  periodBtn:        { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 99, borderWidth: 0.5, borderColor: '#ddd', backgroundColor: '#fff' },
  periodBtnActive:  { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  periodText:       { fontSize: 13, color: '#555' },
  periodTextActive: { color: '#fff', fontWeight: '600' },
  summaryRow:       { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 8 },
  summaryCard:      { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  summaryLabel:     { fontSize: 11, color: '#888', marginBottom: 4 },
  summaryValue:     { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  card:             { backgroundColor: '#fff', margin: 16, marginTop: 8, borderRadius: 16, padding: 16 },
  cardTitle:        { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 16 },
  chartArea:        { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 6, marginBottom: 8 },
  barCol:           { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barAmount:        { fontSize: 9, color: '#888', marginBottom: 4 },
  barBg:            { width: '100%', backgroundColor: '#F0F0F0', borderRadius: 6, height: '80%', justifyContent: 'flex-end' },
  barFill:          { width: '100%', borderRadius: 6 },
  barDay:           { fontSize: 11, color: '#888', marginTop: 4 },
  chartNote:        { fontSize: 11, color: '#888', textAlign: 'center' },
  catRow:           { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  catEmoji:         { fontSize: 22, width: 32 },
  catInfo:          { flex: 1 },
  catTopRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName:          { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  catPct:           { fontSize: 13, fontWeight: '600', color: '#6C63FF' },
  catBarBg:         { backgroundColor: '#F0F0F0', borderRadius: 99, height: 6, marginBottom: 4 },
  catBarFill:       { height: 6, borderRadius: 99 },
  catAmounts:       { fontSize: 11, color: '#888' },
  insightCard:      { backgroundColor: '#EDE9FE', marginHorizontal: 16, borderRadius: 14, padding: 16 },
  insightTitle:     { fontSize: 14, fontWeight: '600', color: '#5B21B6', marginBottom: 6 },
  insightText:      { fontSize: 13, color: '#6D28D9', lineHeight: 20 },
});