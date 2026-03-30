import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useApp } from '../components/AppContext';

const defaultCategories = [
  { name: 'Food & Dining',  emoji: '🍔', color: '#F59E0B', budget: 6000,  pct: 24 },
  { name: 'Transport',      emoji: '🚌', color: '#6C63FF', budget: 3000,  pct: 12 },
  { name: 'Shopping',       emoji: '🛍', color: '#10B981', budget: 4000,  pct: 16 },
  { name: 'Rent & Bills',   emoji: '💡', color: '#3ECFCF', budget: 7000,  pct: 28 },
  { name: 'Entertainment',  emoji: '🎬', color: '#EC4899', budget: 2000,  pct: 8  },
  { name: 'Health',         emoji: '💊', color: '#EF4444', budget: 3000,  pct: 12 },
];

const autoSuggest503020 = [
  { name: 'Food & Dining',  emoji: '🍔', color: '#F59E0B', budget: 5000,  pct: 20 },
  { name: 'Transport',      emoji: '🚌', color: '#6C63FF', budget: 3000,  pct: 12 },
  { name: 'Shopping',       emoji: '🛍', color: '#10B981', budget: 3750,  pct: 15 },
  { name: 'Rent & Bills',   emoji: '💡', color: '#3ECFCF', budget: 7500,  pct: 30 },
  { name: 'Entertainment',  emoji: '🎬', color: '#EC4899', budget: 1250,  pct: 5  },
  { name: 'Health',         emoji: '💊', color: '#EF4444', budget: 2500,  pct: 10 },
];

export default function BudgetScreen() {
  const [totalBudget, setTotalBudget] = useState('25000');
  const [categories, setCategories]   = useState(defaultCategories);
  const [autoApplied, setAutoApplied] = useState(false);
  const [editingIdx, setEditingIdx]   = useState(null);
  const [editValue, setEditValue]     = useState('');
  const [saved, setSaved]             = useState(false);

  const { saveBudgets } = useApp();

  const totalAllocated = categories.reduce((s, c) => s + c.budget, 0);
  const remaining = parseInt(totalBudget || 0) - totalAllocated;

  const handleAutoSuggest = () => {
    const total = parseInt(totalBudget || 25000);
    const updated = autoSuggest503020.map(c => ({
      ...c,
      budget: Math.round((c.pct / 100) * total),
    }));
    setCategories(updated);
    setAutoApplied(true);
    setSaved(false);
  };

  const handleEditBudget = (idx) => {
    setEditingIdx(idx);
    setEditValue(String(categories[idx].budget));
  };

  const handleSaveEdit = (idx) => {
    const newVal = parseInt(editValue) || 0;
    const total = parseInt(totalBudget || 25000);
    const remainingForOthers = total - newVal;
    const othersTotal = categories.reduce((sum, c, i) => i !== idx ? sum + c.budget : sum, 0);

    const updated = categories.map((cat, i) => {
      if (i === idx) {
        return {
          ...cat,
          budget: newVal,
          pct: Math.round((newVal / total) * 100),
        };
      } else {
        const newBudget = othersTotal > 0
          ? Math.round((cat.budget / othersTotal) * remainingForOthers)
          : Math.round(remainingForOthers / (categories.length - 1));
        return {
          ...cat,
          budget: newBudget,
          pct: Math.round((newBudget / total) * 100),
        };
      }
    });

    setCategories(updated);
    setEditingIdx(null);
    setSaved(false);
  };

  const handleSaveAll = () => {
    saveBudgets(parseInt(totalBudget), categories);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <ScrollView style={styles.container}>

      {/* Success Banner */}
      {saved && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ Budget saved! Home tab updated.</Text>
        </View>
      )}

      {/* Total Budget Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Monthly Budget</Text>
        <View style={styles.totalRow}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            style={styles.totalInput}
            value={totalBudget}
            onChangeText={(val) => { setTotalBudget(val); setSaved(false); }}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.allocRow}>
          <Text style={styles.allocText}>Allocated: ₹{totalAllocated.toLocaleString('en-IN')}</Text>
          <Text style={[styles.allocText, { color: remaining >= 0 ? '#10B981' : '#EF4444' }]}>
            {remaining >= 0
              ? `₹${remaining.toLocaleString('en-IN')} free`
              : `₹${Math.abs(remaining).toLocaleString('en-IN')} over`}
          </Text>
        </View>
      </View>

      {/* Auto Suggest Button */}
      <TouchableOpacity style={styles.autoBtn} onPress={handleAutoSuggest}>
        <Text style={styles.autoBtnText}>✨ Auto-suggest (50/30/20 Rule)</Text>
      </TouchableOpacity>

      {autoApplied && (
        <View style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>50/30/20 Rule Applied</Text>
          <Text style={styles.ruleText}>50% Needs → Rent & Bills + Food + Transport</Text>
          <Text style={styles.ruleText}>30% Wants → Shopping + Entertainment</Text>
          <Text style={styles.ruleText}>20% Savings → Set aside every month</Text>
        </View>
      )}

      {/* Category Allocations */}
      <Text style={styles.sectionTitle}>Category Allocations</Text>
      <Text style={styles.sectionSub}>Tap any amount to edit — others auto-adjust</Text>

      <View style={styles.card}>
        {categories.map((cat, idx) => (
          <View key={cat.name} style={[styles.catRow, idx < categories.length - 1 && styles.catBorder]}>
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <View style={styles.catInfo}>
              <Text style={styles.catName}>{cat.name}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${Math.min(cat.pct, 100)}%`, backgroundColor: cat.color }]} />
              </View>
            </View>
            <View style={styles.catRight}>
              {editingIdx === idx ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    autoFocus
                  />
                  <TouchableOpacity style={styles.saveBtn} onPress={() => handleSaveEdit(idx)}>
                    <Text style={styles.saveBtnText}>OK</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => handleEditBudget(idx)}>
                  <Text style={styles.catBudget}>₹{cat.budget.toLocaleString('en-IN')}</Text>
                  <Text style={styles.catPct}>{cat.pct}%</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Save Budget Button */}
      <TouchableOpacity style={styles.saveAllBtn} onPress={handleSaveAll}>
        <Text style={styles.saveAllText}>💾 Save Budget</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F5F5F5' },
  successBanner: { backgroundColor: '#D1FAE5', margin: 16, borderRadius: 10, padding: 12 },
  successText:   { color: '#065F46', fontSize: 14, fontWeight: '600' },
  totalCard:     { backgroundColor: '#1a1a2e', margin: 16, borderRadius: 16, padding: 20 },
  totalLabel:    { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 },
  totalRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rupee:         { color: '#fff', fontSize: 28, fontWeight: '600', marginRight: 4 },
  totalInput:    { color: '#fff', fontSize: 32, fontWeight: '600', flex: 1 },
  allocRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  allocText:     { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  autoBtn:       { backgroundColor: '#EDE9FE', marginHorizontal: 16, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#6C63FF' },
  autoBtnText:   { color: '#6C63FF', fontSize: 15, fontWeight: '600' },
  ruleCard:      { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, borderRadius: 12, padding: 14 },
  ruleTitle:     { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 6 },
  ruleText:      { fontSize: 13, color: '#555', lineHeight: 22 },
  sectionTitle:  { fontSize: 16, fontWeight: '600', marginHorizontal: 16, marginTop: 16, marginBottom: 2, color: '#1a1a2e' },
  sectionSub:    { fontSize: 12, color: '#888', marginHorizontal: 16, marginBottom: 10 },
  card:          { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  catRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  catBorder:     { borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  catEmoji:      { fontSize: 22, width: 32 },
  catInfo:       { flex: 1 },
  catName:       { fontSize: 13, fontWeight: '600', color: '#1a1a2e', marginBottom: 6 },
  barBg:         { backgroundColor: '#F0F0F0', borderRadius: 99, height: 5 },
  barFill:       { height: 5, borderRadius: 99 },
  catRight:      { alignItems: 'flex-end', minWidth: 70 },
  catBudget:     { fontSize: 15, fontWeight: '700', color: '#1a1a2e', textAlign: 'right' },
  catPct:        { fontSize: 11, color: '#888', textAlign: 'right' },
  editRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editInput:     { borderWidth: 0.5, borderColor: '#6C63FF', borderRadius: 8, padding: 6, fontSize: 14, width: 70, textAlign: 'right' },
  saveBtn:       { backgroundColor: '#6C63FF', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  saveBtnText:   { color: '#fff', fontSize: 12, fontWeight: '600' },
  saveAllBtn:    { backgroundColor: '#6C63FF', margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveAllText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
});