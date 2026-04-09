import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../components/AppStateClean';

const BOTTOM_INSET = 126;
const getPalette = (theme) => ({
  background: theme?.background || '#F4F7FB',
  surface: theme?.surface || '#FFFFFF',
  surfaceElevated: theme?.surfaceElevated || '#F8FAFF',
  text: theme?.text || '#111827',
  textMuted: theme?.textMuted || '#667085',
  border: theme?.border || '#D7DEEA',
  accent: theme?.accent || '#5B6CFF',
  danger: theme?.danger || '#EF4444',
});

export default function DashboardFinalScreen({ onViewAll, theme }) {
  const colors = getPalette(theme);
  const { totalBudget, budgets, expenses, getSpentByCategory } = useApp();
  const spentByCategory = getSpentByCategory();
  const totalSpent = Object.values(spentByCategory).reduce((sum, value) => sum + value, 0);
  const safeTotalBudget = totalBudget || 0;
  const percentage = safeTotalBudget > 0 ? Math.min(Math.round((totalSpent / safeTotalBudget) * 100), 100) : 0;

  const categoryList = Array.isArray(budgets) ? budgets : [];
  const categoryMap = Object.fromEntries(categoryList.map((item) => [item.name, item]));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: BOTTOM_INSET }}>
      <View style={[styles.budgetCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
        <Text style={[styles.budgetLabel, { color: colors.textMuted }]}>Total Spent</Text>
        <Text style={[styles.budgetAmount, { color: colors.text }]}>{`\u20B9${(totalSpent || 0).toLocaleString('en-IN')}`}</Text>
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>{`Budget: \u20B9${safeTotalBudget.toLocaleString('en-IN')}`}</Text>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>{percentage}% used</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentage}%`, backgroundColor: percentage > 80 ? colors.danger : colors.accent },
            ]}
          />
        </View>
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending by Category</Text>
      </View>

      <View style={styles.categoryGrid}>
        {categoryList.map((cat) => {
          const spent = spentByCategory[cat.name] || 0;
          const budget = cat.budget || 0;
          const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;

          return (
            <View key={cat.name} style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.categoryIconWrap, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons
                  name={cat.icon || 'pricetag-outline'}
                  size={20}
                  color={cat.color || colors.accent}
                />
              </View>
              <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
              <Text style={[styles.categoryAmount, { color: colors.text }]}>{`\u20B9${spent.toLocaleString('en-IN')}`}</Text>
              <Text style={[styles.categoryBudget, { color: colors.textMuted }]}>{`of \u20B9${budget.toLocaleString('en-IN')}`}</Text>
              <View style={[styles.catBarBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.catBarFill,
                    {
                      width: `${pct}%`,
                      backgroundColor: pct >= 100 ? colors.danger : cat.color || colors.accent,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.txnHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAllBtn, { color: colors.accent }]}>{`View All \u203A`}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.txnCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        {expenses.slice(0, 5).map((txn, index) => {
          const fallbackCategory = categoryMap[txn.category];
          const iconName = txn.icon || fallbackCategory?.icon || 'pricetag-outline';
          const iconColor = fallbackCategory?.color || colors.accent;

          return (
            <View
              key={txn.id}
              style={[
                styles.txnRow,
                index < Math.min(expenses.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.txnEmojiWrap, { backgroundColor: colors.surfaceElevated }]}> 
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>
              <View style={styles.txnInfo}>
                <Text style={[styles.txnName, { color: colors.text }]}>{txn.name}</Text>
                <Text style={[styles.txnCategory, { color: colors.textMuted }]}>{txn.category}</Text>
              </View>
              <View>
                <Text style={[styles.txnAmount, { color: colors.text }]}>{`-\u20B9${txn.amount.toLocaleString('en-IN')}`}</Text>
                <Text style={[styles.txnDate, { color: colors.textMuted }]}>{txn.date}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  budgetCard: {
    margin: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  budgetLabel: { fontSize: 13, marginBottom: 4 },
  budgetAmount: { fontSize: 32, fontWeight: '700', marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 12 },
  progressBarBg: { borderRadius: 99, height: 8 },
  progressBarFill: { height: 8, borderRadius: 99 },
  headerRow: { marginHorizontal: 16, marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, marginTop: 8 },
  categoryCard: {
    borderRadius: 20,
    padding: 14,
    margin: 6,
    width: '44%',
    borderWidth: 1,
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  categoryAmount: { fontSize: 18, fontWeight: '700' },
  categoryBudget: { fontSize: 11, marginBottom: 8 },
  catBarBg: { borderRadius: 99, height: 6 },
  catBarFill: { height: 6, borderRadius: 99 },
  txnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 18, marginBottom: 10 },
  viewAllBtn: { fontSize: 13, fontWeight: '700' },
  txnCard: { borderRadius: 20, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1 },
  txnRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  txnEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: { flex: 1 },
  txnName: { fontSize: 14, fontWeight: '700' },
  txnCategory: { fontSize: 12, marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  txnDate: { fontSize: 11, textAlign: 'right', marginTop: 2 },
});
