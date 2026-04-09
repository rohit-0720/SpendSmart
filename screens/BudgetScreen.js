import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../components/AppStateClean';

const ICON_CHOICES = [
  'fast-food-outline',
  'pizza-outline',
  'cafe-outline',
  'car-outline',
  'train-outline',
  'cart-outline',
  'bag-handle-outline',
  'home-outline',
  'flash-outline',
  'film-outline',
  'fitness-outline',
  'medkit-outline',
  'gift-outline',
  'book-outline',
  'paw-outline',
  'airplane-outline',
];

const DEFAULT_COLOR = '#6C63FF';
const COLORS = ['#F59E0B', '#6C63FF', '#10B981', '#3ECFCF', '#EC4899', '#EF4444', '#8B5CF6', '#F97316'];
const BOTTOM_INSET = 156;

const defaultCategories = [
  { name: 'Food & Dining', emoji: '\u{1F354}', icon: 'fast-food-outline', color: '#F59E0B', budget: 6000, pct: 24 },
  { name: 'Transport', emoji: '\u{1F68C}', icon: 'car-outline', color: '#6C63FF', budget: 3000, pct: 12 },
  { name: 'Shopping', emoji: '\u{1F6CD}', icon: 'bag-handle-outline', color: '#10B981', budget: 4000, pct: 16 },
  { name: 'Rent & Bills', emoji: '\u{1F4A1}', icon: 'flash-outline', color: '#3ECFCF', budget: 7000, pct: 28 },
  { name: 'Entertainment', emoji: '\u{1F3AC}', icon: 'film-outline', color: '#EC4899', budget: 2000, pct: 8 },
  { name: 'Health', emoji: '\u{1F48A}', icon: 'medkit-outline', color: '#EF4444', budget: 3000, pct: 12 },
];

const autoSuggest503020 = [
  { name: 'Food & Dining', emoji: '\u{1F354}', icon: 'fast-food-outline', color: '#F59E0B', budget: 5000, pct: 20 },
  { name: 'Transport', emoji: '\u{1F68C}', icon: 'car-outline', color: '#6C63FF', budget: 3000, pct: 12 },
  { name: 'Shopping', emoji: '\u{1F6CD}', icon: 'bag-handle-outline', color: '#10B981', budget: 3750, pct: 15 },
  { name: 'Rent & Bills', emoji: '\u{1F4A1}', icon: 'flash-outline', color: '#3ECFCF', budget: 7500, pct: 30 },
  { name: 'Entertainment', emoji: '\u{1F3AC}', icon: 'film-outline', color: '#EC4899', budget: 1250, pct: 5 },
  { name: 'Health', emoji: '\u{1F48A}', icon: 'medkit-outline', color: '#EF4444', budget: 2500, pct: 10 },
];

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
  chip: theme?.chip || '#F2F5FB',
  input: theme?.input || '#F8FAFC',
  isDark: theme?.key === 'dark',
});

const withComputedPct = (items, total) => items.map((item) => ({ ...item, pct: total > 0 ? Math.round(((item.budget || 0) / total) * 100) : 0 }));

export default function BudgetScreen({ theme }) {
  const colors = getPalette(theme);
  const [totalBudget, setTotalBudget] = useState('25000');
  const [categories, setCategories] = useState(defaultCategories);
  const [lockedIdx, setLockedIdx] = useState(new Set());
  const [autoApplied, setAutoApplied] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saved, setSaved] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingCatIdx, setEditingCatIdx] = useState(null);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('\u{1F31F}');
  const [catIcon, setCatIcon] = useState('star-outline');
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState(null);

  const { saveBudgets, budgets, totalBudget: ctxTotal } = useApp();

  useEffect(() => {
    if (budgets && budgets.length > 0) {
      const normalized = Array.isArray(budgets)
        ? budgets.map((cat, index) => ({
            ...cat,
            icon: cat.icon || defaultCategories[index]?.icon || 'pricetag-outline',
            pct: ctxTotal > 0 ? Math.round(((cat.budget || 0) / ctxTotal) * 100) : 0,
          }))
        : Object.entries(budgets).map(([name, value], index) => {
            const budget = typeof value === 'object' ? value.budget : value;
            const defaults = defaultCategories.find((item) => item.name === name) || defaultCategories[index];
            return {
              name,
              budget,
              emoji: typeof value === 'object' ? value.emoji || defaults?.emoji || '\u{1F31F}' : defaults?.emoji || '\u{1F31F}',
              icon: typeof value === 'object' ? value.icon || defaults?.icon || 'pricetag-outline' : defaults?.icon || 'pricetag-outline',
              color: typeof value === 'object' ? value.color || defaults?.color || DEFAULT_COLOR : defaults?.color || DEFAULT_COLOR,
              locked: typeof value === 'object' ? !!value.locked : false,
              pct: ctxTotal > 0 ? Math.round(((budget || 0) / ctxTotal) * 100) : 0,
            };
          });

      setCategories(normalized);
      const restoredLocks = new Set();
      normalized.forEach((cat, index) => {
        if (cat.locked) restoredLocks.add(index);
      });
      setLockedIdx(restoredLocks);
    }

    if (ctxTotal) setTotalBudget(String(ctxTotal));
  }, [budgets, ctxTotal]);

  const total = parseInt(totalBudget, 10) || 0;
  const totalAllocated = categories.reduce((sum, cat) => sum + (cat.budget || 0), 0);
  const remaining = total - totalAllocated;
  const canSave = total > 0 && categories.length > 0;

  const handleAutoSuggest = () => {
    const nextTotal = parseInt(totalBudget, 10) || 25000;
    const updated = withComputedPct(
      autoSuggest503020.map((cat) => ({
        ...cat,
        budget: Math.round((cat.pct / 100) * nextTotal),
        locked: false,
      })),
      nextTotal,
    );
    setCategories(updated);
    setLockedIdx(new Set());
    setAutoApplied(true);
    setSaved(false);
  };

  const handleEditBudget = (idx) => {
    setEditingIdx(idx);
    setEditValue(String(categories[idx].budget));
  };

  const handleSaveEdit = (idx) => {
    const newVal = parseInt(editValue, 10) || 0;
    const nextTotal = parseInt(totalBudget, 10) || 0;
    const newLocked = new Set(lockedIdx);
    newLocked.add(idx);
    setLockedIdx(newLocked);

    const lockedTotal = categories.reduce((sum, cat, index) => {
      if (index === idx) return sum + newVal;
      if (newLocked.has(index)) return sum + cat.budget;
      return sum;
    }, 0);

    const budgetForUnlocked = nextTotal - lockedTotal;
    const unlockedTotal = categories.reduce((sum, cat, index) => {
      if (index === idx || newLocked.has(index)) return sum;
      return sum + cat.budget;
    }, 0);

    const updated = categories.map((cat, index) => {
      if (index === idx) {
        return {
          ...cat,
          budget: newVal,
          locked: true,
          pct: nextTotal > 0 ? Math.round((newVal / nextTotal) * 100) : 0,
        };
      }
      if (newLocked.has(index)) {
        return {
          ...cat,
          pct: nextTotal > 0 ? Math.round((cat.budget / nextTotal) * 100) : 0,
        };
      }

      const unlockedCount = Math.max(categories.length - newLocked.size, 1);
      const redistributed = unlockedTotal > 0 ? Math.round((cat.budget / unlockedTotal) * budgetForUnlocked) : Math.round(budgetForUnlocked / unlockedCount);
      const safeBudget = Math.max(0, redistributed);
      return {
        ...cat,
        budget: safeBudget,
        locked: false,
        pct: nextTotal > 0 ? Math.round((safeBudget / nextTotal) * 100) : 0,
      };
    });

    setCategories(updated);
    setEditingIdx(null);
    setSaved(false);
  };

  const handleSaveAll = () => {
    const nextTotal = parseInt(totalBudget, 10) || 0;
    if (nextTotal <= 0) {
      alert('Please enter a valid budget');
      return;
    }
    saveBudgets(nextTotal, categories);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const openAddCategory = () => {
    setEditingCatIdx(null);
    setCatName('');
    setCatEmoji('\u{1F31F}');
    setCatIcon('star-outline');
    setCatModalVisible(true);
  };

  const openEditCategory = (idx) => {
    setEditingCatIdx(idx);
    setCatName(categories[idx].name);
    setCatEmoji(categories[idx].emoji);
    setCatIcon(categories[idx].icon || 'star-outline');
    setCatModalVisible(true);
  };

  const handleSaveCategory = () => {
    const trimmed = catName.trim();
    if (!trimmed) {
      alert('Please enter a category name');
      return;
    }

    if (editingCatIdx !== null) {
      const updated = categories.map((cat, index) => (index === editingCatIdx ? { ...cat, name: trimmed, emoji: catEmoji, icon: catIcon } : cat));
      setCategories(updated);
    } else {
      const colorIdx = categories.length % COLORS.length;
      const newCat = {
        name: trimmed,
        emoji: catEmoji,
        icon: catIcon,
        color: COLORS[colorIdx],
        budget: 0,
        pct: 0,
        locked: false,
      };
      setCategories((prev) => [...prev, newCat]);
    }

    setCatModalVisible(false);
    setSaved(false);
  };

  const handleDeleteCategory = (idx) => {
    const deletedBudget = categories[idx].budget;
    const remainingCategories = categories.filter((_, index) => index !== idx);

    const newLocked = new Set();
    lockedIdx.forEach((lockedIndex) => {
      if (lockedIndex < idx) newLocked.add(lockedIndex);
      else if (lockedIndex > idx) newLocked.add(lockedIndex - 1);
    });

    const unlockedRemaining = remainingCategories.filter((_, index) => !newLocked.has(index));
    const share = unlockedRemaining.length > 0 ? Math.round(deletedBudget / unlockedRemaining.length) : 0;
    const nextTotal = parseInt(totalBudget, 10) || 0;

    const updated = remainingCategories.map((cat, index) => {
      const nextBudget = newLocked.has(index) ? cat.budget : cat.budget + share;
      return {
        ...cat,
        budget: nextBudget,
        pct: nextTotal > 0 ? Math.round((nextBudget / nextTotal) * 100) : 0,
      };
    });

    setCategories(updated);
    setLockedIdx(newLocked);
    setDeleteConfirmIdx(null);
    setSaved(false);
  };

  const allocationTone = useMemo(() => (remaining >= 0 ? colors.success : colors.danger), [remaining, colors.success, colors.danger]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: BOTTOM_INSET }}>
      {saved ? (
        <View style={[styles.successBanner, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.successText, { color: colors.text }]}>Budget saved. Your dashboard is now synced.</Text>
        </View>
      ) : null}

      <View style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Monthly Budget</Text>
        <View style={styles.totalRow}>
          <Text style={[styles.rupee, { color: colors.text }]}>{'\u20B9'}</Text>
          <TextInput
            style={[styles.totalInput, { color: colors.text }]}
            value={totalBudget}
            onChangeText={(val) => {
              setTotalBudget(val);
              setLockedIdx(new Set());
              setSaved(false);
            }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.allocRow}>
          <Text style={[styles.allocText, { color: colors.textMuted }]}>{`Allocated: \u20B9${totalAllocated.toLocaleString('en-IN')}`}</Text>
          <Text style={[styles.allocText, { color: allocationTone }]}>
            {remaining >= 0 ? `\u20B9${remaining.toLocaleString('en-IN')} free` : `\u20B9${Math.abs(remaining).toLocaleString('en-IN')} over`}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.autoBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={handleAutoSuggest}>
        <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
        <Text style={[styles.autoBtnText, { color: colors.accent }]}>Auto-suggest (50/30/20 Rule)</Text>
      </TouchableOpacity>

      {autoApplied ? (
        <View style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.ruleTitle, { color: colors.text }]}>50/30/20 Rule Applied</Text>
          <Text style={[styles.ruleText, { color: colors.textMuted }]}>50% needs: Rent, food, transport</Text>
          <Text style={[styles.ruleText, { color: colors.textMuted }]}>30% wants: Shopping and entertainment</Text>
          <Text style={[styles.ruleText, { color: colors.textMuted }]}>20% savings: Keep aside each month</Text>
        </View>
      ) : null}

      <View style={styles.sectionRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Allocations</Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Tap amount to edit. Use the pencil to rename a category.</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addCatBtn,
            {
              backgroundColor: '#111111',
              borderWidth: 0,
              borderColor: 'transparent',
            },
          ]}
          onPress={openAddCategory}
        >
          <Text style={styles.addCatBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        {categories.map((cat, idx) => (
          <View key={`${cat.name}-${idx}`} style={[styles.catRow, idx < categories.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}> 
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}> 
              <Ionicons name={cat.icon || 'pricetag-outline'} size={18} color={cat.color || DEFAULT_COLOR} />
            </View>

            <View style={styles.catInfo}>
              <View style={styles.catNameRow}>
                <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                {lockedIdx.has(idx) ? <Ionicons name="lock-closed" size={12} color={colors.accent} /> : null}
                <TouchableOpacity onPress={() => openEditCategory(idx)}>
                  <Ionicons name="create-outline" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={[styles.barBg, { backgroundColor: colors.chip }]}> 
                <View style={[styles.barFill, { width: `${Math.min(cat.pct, 100)}%`, backgroundColor: cat.color || colors.accent }]} />
              </View>
            </View>

            <View style={styles.catRight}>
              {editingIdx === idx ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.editInput, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      {
                        backgroundColor: colors.accent,
                        borderWidth: colors.isDark ? 1 : 0,
                        borderColor: colors.isDark ? colors.border : 'transparent',
                      },
                    ]}
                    onPress={() => handleSaveEdit(idx)}
                  >
                    <Text style={[styles.saveBtnText, { color: colors.isDark ? '#111111' : '#fff' }]}>OK</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => handleEditBudget(idx)}>
                  <Text style={[styles.catBudget, { color: colors.text }]}>{`\u20B9${cat.budget.toLocaleString('en-IN')}`}</Text>
                  <Text style={[styles.catPct, { color: colors.textMuted }]}>{`${cat.pct}%`}</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity onPress={() => setDeleteConfirmIdx(idx)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {deleteConfirmIdx !== null ? (
        <View style={[styles.deleteConfirm, { backgroundColor: colors.surface, borderColor: colors.danger }]}> 
          <Text style={[styles.deleteConfirmText, { color: colors.text }]}>{`Delete "${categories[deleteConfirmIdx]?.name}"? Its budget will be distributed to the other categories.`}</Text>
          <View style={styles.deleteConfirmBtns}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.chip }]} onPress={() => setDeleteConfirmIdx(null)}>
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmDeleteBtn, { backgroundColor: colors.danger }]} onPress={() => handleDeleteCategory(deleteConfirmIdx)}>
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={[
          styles.saveAllBtn,
          {
            backgroundColor: canSave ? colors.accent : colors.accentSoft || '#A5B4FC',
            borderWidth: colors.isDark ? 1 : 0,
            borderColor: colors.isDark ? colors.border : 'transparent',
          },
        ]}
        onPress={handleSaveAll}
        disabled={!canSave}
      >
        <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.isDark ? '#111111' : '#fff'} />
        <Text style={[styles.saveAllText, { color: colors.isDark ? '#111111' : '#fff' }]}>Save Budget</Text>
      </TouchableOpacity>

      <Modal visible={catModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingCatIdx !== null ? 'Edit Category' : 'Add Category'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Category Name</Text>
              <TextInput
                style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]}
                value={catName}
                onChangeText={setCatName}
                placeholder="e.g. Groceries"
                placeholderTextColor={colors.textMuted}
                maxLength={20}
              />

              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Pick a symbol</Text>
              <View style={styles.emojiGrid}>
                {ICON_CHOICES.map((iconName, index) => (
                  <TouchableOpacity
                    key={iconName}
                    style={[
                      styles.emojiOption,
                      { backgroundColor: colors.chip, borderColor: catIcon === iconName ? colors.accent : 'transparent' },
                    ]}
                    onPress={() => {
                      setCatIcon(iconName);
                      setCatEmoji(defaultCategories[index]?.emoji || '\u{1F31F}');
                    }}
                  >
                    <Ionicons name={iconName} size={20} color={colors.text} />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.previewRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
                <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}> 
                  <Ionicons name={catIcon} size={18} color={colors.accent} />
                </View>
                <Text style={[styles.previewName, { color: colors.text }]}>{catName || 'Category Name'}</Text>
              </View>
            </ScrollView>

            <View style={[styles.modalBtns, { borderTopColor: colors.border }]}> 
              <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: colors.chip }]} onPress={() => setCatModalVisible(false)}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  {
                    backgroundColor: colors.accent,
                    borderWidth: colors.isDark ? 1 : 0,
                    borderColor: colors.isDark ? colors.border : 'transparent',
                  },
                ]}
                onPress={handleSaveCategory}
              >
                <Text style={[styles.modalSaveText, { color: colors.isDark ? '#111111' : '#fff' }]}>{editingCatIdx !== null ? 'Save Changes' : 'Add Category'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, borderRadius: 16, padding: 12, borderWidth: 1 },
  successText: { fontSize: 14, fontWeight: '600', flex: 1 },
  totalCard: { margin: 16, borderRadius: 24, padding: 20, borderWidth: 1 },
  totalLabel: { fontSize: 13, marginBottom: 8 },
  totalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rupee: { fontSize: 28, fontWeight: '700', marginRight: 4 },
  totalInput: { fontSize: 34, fontWeight: '700', flex: 1 },
  allocRow: { flexDirection: 'row', justifyContent: 'space-between' },
  allocText: { fontSize: 13, fontWeight: '600' },
  autoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, borderRadius: 16, padding: 14, borderWidth: 1 },
  autoBtnText: { fontSize: 15, fontWeight: '700' },
  ruleCard: { marginHorizontal: 16, marginTop: 10, borderRadius: 16, padding: 14, borderWidth: 1 },
  ruleTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  ruleText: { fontSize: 13, lineHeight: 22 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionSub: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  addCatBtn: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  addCatBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  card: { marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  catRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catInfo: { flex: 1 },
  catNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  catName: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  barBg: { borderRadius: 999, height: 6 },
  barFill: { height: 6, borderRadius: 999 },
  catRight: { alignItems: 'flex-end', minWidth: 82 },
  catBudget: { fontSize: 16, fontWeight: '700', textAlign: 'right' },
  catPct: { fontSize: 11, textAlign: 'right', marginTop: 2 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editInput: { borderWidth: 1, borderRadius: 10, padding: 8, fontSize: 14, width: 82, textAlign: 'right' },
  saveBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  deleteConfirm: { marginHorizontal: 16, marginTop: 10, borderRadius: 16, padding: 14, borderWidth: 1 },
  deleteConfirmText: { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  deleteConfirmBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '700' },
  confirmDeleteBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  confirmDeleteText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  saveAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, borderRadius: 16, padding: 16 },
  saveAllText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 16 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  emojiOption: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  previewRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, marginBottom: 20, gap: 8, borderWidth: 1 },
  previewName: { fontSize: 15, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1 },
  modalCancelBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700' },
  modalSaveBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSaveText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
