import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../components/AppStateClean';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BOTTOM_INSET = 126;

const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      month: d.getMonth(),
      year: d.getFullYear(),
    });
  }
  return options;
};

const getPalette = (theme) => ({
  background: theme?.background || '#F4F7FB',
  surface: theme?.surface || '#FFFFFF',
  surfaceElevated: theme?.surfaceElevated || '#F8FAFF',
  text: theme?.text || '#111827',
  textMuted: theme?.textMuted || '#667085',
  border: theme?.border || '#D7DEEA',
  accent: theme?.accent || '#5B6CFF',
  danger: theme?.danger || '#EF4444',
  success: theme?.success || '#16A34A',
  isDark: theme?.key === 'dark',
});

export default function AnalyticsScreen({ theme }) {
  const colors = getPalette(theme);
  const { budgets, totalBudget, getSpentByCategory, getExpensesByMonth } = useApp();
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);

  const spentByCategory = getSpentByCategory(selectedMonth);
  const monthExpenses = getExpensesByMonth(selectedMonth);
  const totalSpent = Object.values(spentByCategory).reduce((sum, value) => sum + value, 0);
  const totalRemaining = Math.max(totalBudget - totalSpent, 0);

  const categoryList = Array.isArray(budgets) ? budgets : [];

  const weeklyData = days.map((day, index) => {
    const total = monthExpenses
      .filter((expense) => new Date(expense.fullDate).getDay() === index)
      .reduce((sum, expense) => sum + expense.amount, 0);

    return { day, amount: total };
  });

  const maxAmount = Math.max(...weeklyData.map((item) => item.amount), 1);
  const activeDays = weeklyData.filter((item) => item.amount > 0).length;
  const avgAmount = activeDays > 0 ? Math.round(totalSpent / activeDays) : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: BOTTOM_INSET }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
        {monthOptions.map((option) => {
          const selected = selectedMonth.label === option.label;
          return (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.periodBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selected && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={() => setSelectedMonth(option)}
            >
              <Text style={[styles.periodText, { color: selected ? (colors.isDark ? '#111111' : '#fff') : colors.text }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Spent</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{`\u20B9${totalSpent.toLocaleString('en-IN')}`}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Daily Average</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{`\u20B9${avgAmount.toLocaleString('en-IN')}`}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Remaining</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>{`\u20B9${totalRemaining.toLocaleString('en-IN')}`}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Spending by Day</Text>
          <MaterialCommunityIcons name="chart-bar" size={20} color={colors.accent} />
        </View>
        <View style={styles.chartArea}>
          {weeklyData.map((item) => {
            const heightPct = (item.amount / maxAmount) * 100;
            const isOver = item.amount > avgAmount && item.amount > 0;
            return (
              <View key={item.day} style={styles.barCol}>
                <Text style={[styles.barAmount, { color: colors.textMuted }]}>
                  {item.amount > 0 ? `\u20B9${item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount}` : ''}
                </Text>
                <View style={[styles.barBg, { backgroundColor: colors.surfaceElevated }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max(heightPct, item.amount > 0 ? 5 : 0)}%`,
                        backgroundColor: isOver ? colors.danger : colors.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barDay, { color: colors.textMuted }]}>{item.day}</Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.chartNote, { color: colors.textMuted }]}>{`Red bars = above daily average (\u20B9${avgAmount})`}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Category Breakdown</Text>
          <MaterialCommunityIcons name="chart-donut" size={20} color={colors.accent} />
        </View>
        {categoryList.map((cat) => {
          const spent = spentByCategory[cat.name] || 0;
          const budget = cat.budget || 0;
          const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
          const isOver = spent > budget && budget > 0;
          return (
            <View key={cat.name} style={styles.catRow}>
              <View style={[styles.catIconWrap, { backgroundColor: colors.surfaceElevated }]}> 
                <Ionicons
                  name={cat.icon || 'pricetag-outline'}
                  size={18}
                  color={cat.color || colors.accent}
                />
              </View>
              <View style={styles.catInfo}>
                <View style={styles.catTopRow}>
                  <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                  <Text style={[styles.catPct, { color: isOver ? colors.danger : colors.accent }]}>{isOver ? 'Over' : `${pct}%`}</Text>
                </View>
                <View style={[styles.catBarBg, { backgroundColor: colors.surfaceElevated }]}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: isOver ? colors.danger : cat.color || colors.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.catAmounts, { color: colors.textMuted }]}>{`\u20B9${spent.toLocaleString('en-IN')} of \u20B9${budget.toLocaleString('en-IN')}`}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.insightCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Text style={[styles.insightTitle, { color: colors.text }]}>Smart Insight</Text>
        <Text style={[styles.insightText, { color: colors.textMuted }]}>
          {totalSpent === 0
            ? `No expenses recorded for ${selectedMonth.label} yet.`
            : totalSpent > totalBudget
            ? `You have exceeded your \u20B9${totalBudget.toLocaleString('en-IN')} budget by \u20B9${(totalSpent - totalBudget).toLocaleString('en-IN')}.`
            : `You have spent \u20B9${totalSpent.toLocaleString('en-IN')} of your \u20B9${totalBudget.toLocaleString('en-IN')} budget. \u20B9${totalRemaining.toLocaleString('en-IN')} remains for ${selectedMonth.label}.`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  periodRow: { flexDirection: 'row', margin: 16, gap: 8 },
  periodBtn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1 },
  periodText: { fontSize: 13, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 8 },
  summaryCard: { flex: 1, borderRadius: 18, padding: 12, borderWidth: 1 },
  summaryLabel: { fontSize: 11, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  card: { margin: 16, marginTop: 8, borderRadius: 22, padding: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 6, marginBottom: 8 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barAmount: { fontSize: 9, marginBottom: 4 },
  barBg: { width: '100%', borderRadius: 8, height: '80%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 8 },
  barDay: { fontSize: 11, marginTop: 6 },
  chartNote: { fontSize: 11, textAlign: 'center' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  catIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catInfo: { flex: 1 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 13, fontWeight: '700' },
  catPct: { fontSize: 13, fontWeight: '700' },
  catBarBg: { borderRadius: 999, height: 7, marginBottom: 6 },
  catBarFill: { height: 7, borderRadius: 999 },
  catAmounts: { fontSize: 11 },
  insightCard: { marginHorizontal: 16, borderRadius: 20, padding: 16, borderWidth: 1 },
  insightTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  insightText: { fontSize: 13, lineHeight: 20 },
});
