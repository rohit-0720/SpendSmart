import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useApp } from '../components/AppContext';

const PRESET_EMOJIS = [
  '🍔','🍕','🍜','🍱','🥗','☕','🍺','🛒',
  '🚌','🚗','✈️','🛵','🚇','⛽','🚕','🚲',
  '🛍','👟','👗','💄','👜','🎮','📱','💻',
  '💡','🏠','🔧','🏡','📺','🛁','🪴','🧹',
  '🎬','🎵','🎯','🎲','🎭','🏋️','⚽','🎸',
  '💊','🏥','🧘','🩺','💉','🦷','🧴','🩹',
  '📚','✏️','🎓','💼','💰','📈','🏦','🎁',
  '🐶','🐱','🌿','☀️','🌙','❤️','⭐','🔑',
];

const DEFAULT_COLOR = '#6C63FF';
const COLORS = ['#F59E0B','#6C63FF','#10B981','#3ECFCF','#EC4899','#EF4444','#8B5CF6','#F97316'];

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
  const [lockedIdx, setLockedIdx]     = useState(new Set());
  const [autoApplied, setAutoApplied] = useState(false);
  const [editingIdx, setEditingIdx]   = useState(null);
  const [editValue, setEditValue]     = useState('');
  const [saved, setSaved]             = useState(false);

  // Category editor modal state
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingCatIdx, setEditingCatIdx]     = useState(null); // null = adding new
  const [catName, setCatName]                 = useState('');
  const [catEmoji, setCatEmoji]               = useState('⭐');

  // Delete confirmation
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState(null);

  const { saveBudgets, budgets, totalBudget: ctxTotal } = useApp();

useEffect(() => {
  if (budgets && budgets.length > 0) {
    // ✅ handles both old object format and new array format
    if (Array.isArray(budgets)) {
      const loaded = budgets.map(cat => ({
        ...cat,
        pct: ctxTotal > 0 ? Math.round((cat.budget / ctxTotal) * 100) : 0,
      }));
      setCategories(loaded);

      // ✅ restore locked state
      const restoredLocks = new Set();
      loaded.forEach((cat, i) => { if (cat.locked) restoredLocks.add(i); });
      setLockedIdx(restoredLocks);
    } else {
      // fallback for old object format
      const loaded = Object.entries(budgets).map(([name, val]) => {
        const isObj = typeof val === 'object';
        const budget = isObj ? val.budget : val;
        const emoji  = isObj ? val.emoji  : (defaultCategories.find(d => d.name === name)?.emoji || '⭐');
        const color  = isObj ? val.color  : (defaultCategories.find(d => d.name === name)?.color || '#6C63FF');
        return { name, emoji, color, budget, locked: false,
          pct: ctxTotal > 0 ? Math.round((budget / ctxTotal) * 100) : 0,
        };
      });
      setCategories(loaded);
    }
  }
  if (ctxTotal) setTotalBudget(String(ctxTotal));
}, [budgets, ctxTotal]);

  const total          = parseInt(totalBudget) || 0;
  const totalAllocated = categories.reduce((s, c) => s + (c.budget || 0), 0);
  const remaining      = total - totalAllocated;

  // ==================== BUDGET EDIT ====================
 const handleAutoSuggest = () => {
  const t = parseInt(totalBudget) || 25000;
  const updated = autoSuggest503020.map(c => ({
    ...c,
    budget: Math.round((c.pct / 100) * t),
    locked: false, 
  }));
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
  const newVal    = parseInt(editValue) || 0;
  const total     = parseInt(totalBudget) || 0;
  const newLocked = new Set(lockedIdx);
  newLocked.add(idx);
  setLockedIdx(newLocked);

  const lockedTotal = categories.reduce((sum, cat, i) => {
    if (i === idx) return sum + newVal;
    if (newLocked.has(i)) return sum + cat.budget;
    return sum;
  }, 0);

  const budgetForUnlocked = total - lockedTotal;
  const unlockedTotal     = categories.reduce((sum, cat, i) => {
    if (i === idx || newLocked.has(i)) return sum;
    return sum + cat.budget;
  }, 0);

  const updated = categories.map((cat, i) => {
    if (i === idx) return {
      ...cat, budget: newVal, locked: true, // ✅ stamp locked
      pct: total > 0 ? Math.round((newVal / total) * 100) : 0,
    };
    if (newLocked.has(i)) return {
      ...cat, pct: total > 0 ? Math.round((cat.budget / total) * 100) : 0,
    };
    const newBudget = unlockedTotal > 0
      ? Math.round((cat.budget / unlockedTotal) * budgetForUnlocked)
      : Math.round(budgetForUnlocked / (categories.length - newLocked.size));
    return {
      ...cat, budget: Math.max(0, newBudget), locked: false,
      pct: total > 0 ? Math.round((Math.max(0, newBudget) / total) * 100) : 0,
    };
  });

  setCategories(updated);
  setEditingIdx(null);
  setSaved(false);
};

  const handleSaveAll = () => {
    const total = parseInt(totalBudget) || 0;
    if (total <= 0) { alert('Please enter a valid budget'); return; }
    saveBudgets(total, categories);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ==================== CATEGORY EDIT ====================
  const openAddCategory = () => {
    setEditingCatIdx(null);
    setCatName('');
    setCatEmoji('⭐');
    setCatModalVisible(true);
  };

  const openEditCategory = (idx) => {
    setEditingCatIdx(idx);
    setCatName(categories[idx].name);
    setCatEmoji(categories[idx].emoji);
    setCatModalVisible(true);
  };

  const handleSaveCategory = () => {
    const trimmed = catName.trim();
    if (!trimmed) { alert('Please enter a category name'); return; }

    if (editingCatIdx !== null) {
      // Editing existing category
      const updated = categories.map((cat, i) =>
        i === editingCatIdx ? { ...cat, name: trimmed, emoji: catEmoji } : cat
      );
      setCategories(updated);
    } else {
      // Adding new category — starts at ₹0, unlocked
      const colorIdx  = categories.length % COLORS.length;
      const newCat    = { name: trimmed, emoji: catEmoji, color: COLORS[colorIdx], budget: 0, pct: 0 };
      setCategories(prev => [...prev, newCat]);
      // new category is NOT locked so redistribution can touch it
    }

    setCatModalVisible(false);
    setSaved(false);
  };

  // ==================== DELETE CATEGORY ====================
  const handleDeleteCategory = (idx) => {
    const deletedBudget = categories[idx].budget;
    const remaining     = categories.filter((_, i) => i !== idx);

    // Update locked indices — shift down any index above deleted one
    const newLocked = new Set();
    lockedIdx.forEach(li => {
      if (li < idx) newLocked.add(li);
      else if (li > idx) newLocked.add(li - 1);
      // li === idx is removed
    });

    // Distribute deleted budget among unlocked remaining categories
    const unlockedRemaining = remaining.filter((_, i) => !newLocked.has(i));
    const share = unlockedRemaining.length > 0
      ? Math.round(deletedBudget / unlockedRemaining.length)
      : 0;

    const total   = parseInt(totalBudget) || 0;
    const updated = remaining.map((cat, i) => {
      const newBudget = newLocked.has(i) ? cat.budget : cat.budget + share;
      return { ...cat, budget: newBudget, pct: total > 0 ? Math.round((newBudget / total) * 100) : 0 };
    });

    setCategories(updated);
    setLockedIdx(newLocked);
    setDeleteConfirmIdx(null);
    setSaved(false);
  };

  // ==================== RENDER ====================
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
            style={[styles.totalInput, { borderWidth: 0, outlineStyle: 'none', outlineWidth: 0 }]}
            value={totalBudget}
            onChangeText={(val) => { setTotalBudget(val); setLockedIdx(new Set()); setSaved(false); }}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.allocRow}>
          <Text style={styles.allocText}>Allocated: ₹{totalAllocated.toLocaleString('en-IN')}</Text>
          <Text style={[styles.allocText, { color: remaining >= 0 ? '#10B981' : '#EF4444' }]}>
            {remaining >= 0 ? `₹${remaining.toLocaleString('en-IN')} free` : `₹${Math.abs(remaining).toLocaleString('en-IN')} over`}
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

      {/* Section Header with Add button */}
      <View style={styles.sectionRow}>
        <View>
          <Text style={styles.sectionTitle}>Category Allocations</Text>
          <Text style={styles.sectionSub}>Tap amount to edit budget · ✏️ to edit category</Text>
        </View>
        <TouchableOpacity style={styles.addCatBtn} onPress={openAddCategory}>
          <Text style={styles.addCatBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {categories.map((cat, idx) => (
          <View key={`${cat.name}-${idx}`} style={[styles.catRow, idx < categories.length - 1 && styles.catBorder]}>

            {/* Emoji — tap to edit category */}
            {/* Emoji (no longer tappable for edit) */}
<Text style={styles.catEmoji}>{cat.emoji}</Text>

<View style={styles.catInfo}>
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
    <Text style={styles.catName}>{cat.name}</Text>
    {lockedIdx.has(idx) && <Text style={{ fontSize: 10, color: '#6C63FF' }}>🔒</Text>}
    {/* ✅ Pencil right after name */}
    <TouchableOpacity onPress={() => openEditCategory(idx)}>
      <Text style={{ fontSize: 11 }}>✏️</Text>
    </TouchableOpacity>
  </View>
  <View style={styles.barBg}>
    <View style={[styles.barFill, { width: `${Math.min(cat.pct, 100)}%`, backgroundColor: cat.color }]} />
  </View>
</View>

            {/* Budget edit */}
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

            {/* Delete button */}
            <TouchableOpacity onPress={() => setDeleteConfirmIdx(idx)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>🗑</Text>
            </TouchableOpacity>

          </View>
        ))}
      </View>

      {/* Inline delete confirmation */}
      {deleteConfirmIdx !== null && (
        <View style={styles.deleteConfirm}>
          <Text style={styles.deleteConfirmText}>
            Delete "{categories[deleteConfirmIdx]?.name}"? Its budget will be distributed to other categories.
          </Text>
          <View style={styles.deleteConfirmBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteConfirmIdx(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmDeleteBtn} onPress={() => handleDeleteCategory(deleteConfirmIdx)}>
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Save Budget Button */}
      <TouchableOpacity style={styles.saveAllBtn} onPress={handleSaveAll}>
        <Text style={styles.saveAllText}>💾 Save Budget</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />

 {/* ==================== CATEGORY EDIT MODAL ==================== */}
<Modal visible={catModalVisible} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>

      <Text style={styles.modalTitle}>
        {editingCatIdx !== null ? 'Edit Category' : 'Add Category'}
      </Text>

      {/* ✅ SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {/* Name input */}
        <Text style={styles.modalLabel}>Category Name</Text>
        <TextInput
          style={styles.modalInput}
          value={catName}
          onChangeText={setCatName}
          placeholder="e.g. Groceries"
          maxLength={20}
        />

        {/* Emoji picker */}
        <Text style={styles.modalLabel}>Pick an Icon</Text>
        <View style={styles.emojiGrid}>
          {PRESET_EMOJIS.map((em) => (
            <TouchableOpacity
              key={em}
              style={[
                styles.emojiOption,
                catEmoji === em && styles.emojiSelected
              ]}
              onPress={() => setCatEmoji(em)}
            >
              <Text style={styles.emojiOptionText}>{em}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Preview: </Text>
          <Text style={styles.previewEmoji}>{catEmoji}</Text>
          <Text style={styles.previewName}>
            {catName || 'Category Name'}
          </Text>
        </View>
      </ScrollView>

      {/* ✅ FIXED BUTTONS (always visible) */}
      <View style={styles.modalBtns}>
        <TouchableOpacity
          style={styles.modalCancelBtn}
          onPress={() => setCatModalVisible(false)}
        >
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modalSaveBtn}
          onPress={handleSaveCategory}
        >
          <Text style={styles.modalSaveText}>
            {editingCatIdx !== null ? 'Save Changes' : 'Add Category'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  </View>
</Modal>
</ScrollView>  

);
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#fff' },
  successBanner:      { backgroundColor: '#D1FAE5', margin: 16, borderRadius: 10, padding: 12 },
  successText:        { color: '#065F46', fontSize: 14, fontWeight: '600' },
  totalCard:          { backgroundColor: '#1a1a2e', margin: 16, borderRadius: 16, padding: 20 },
  totalLabel:         { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 },
  totalRow:           { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rupee:              { color: '#fff', fontSize: 28, fontWeight: '600', marginRight: 4 },
  totalInput:         { color: '#fff', fontSize: 32, fontWeight: '600', flex: 1, borderWidth: 0, outlineWidth: 0, backgroundColor: 'transparent' },
  allocRow:           { flexDirection: 'row', justifyContent: 'space-between' },
  allocText:          { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  autoBtn:            { backgroundColor: '#EDE9FE', marginHorizontal: 16, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#6C63FF' },
  autoBtnText:        { color: '#6C63FF', fontSize: 15, fontWeight: '600' },
  ruleCard:           { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, borderRadius: 12, padding: 14 },
  ruleTitle:          { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 6 },
  ruleText:           { fontSize: 13, color: '#555', lineHeight: 22 },
  sectionRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  sectionTitle:       { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  sectionSub:         { fontSize: 12, color: '#888', marginTop: 2 },
  addCatBtn:          { backgroundColor: '#6C63FF', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14 },
  addCatBtnText:      { color: '#fff', fontSize: 13, fontWeight: '600' },
  card:               { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  catRow:             { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  catBorder:          { borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  catEmoji:           { fontSize: 22 },
  catInfo:            { flex: 1 },
  catName:            { fontSize: 13, fontWeight: '600', color: '#1a1a2e', marginBottom: 0 },
  barBg:              { backgroundColor: '#F0F0F0', borderRadius: 99, height: 5 },
  barFill:            { height: 5, borderRadius: 99 },
  catRight:           { alignItems: 'flex-end', minWidth: 70 },
  catBudget:          { fontSize: 15, fontWeight: '700', color: '#1a1a2e', textAlign: 'right' },
  catPct:             { fontSize: 11, color: '#888', textAlign: 'right' },
  editRow:            { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editInput:          { borderWidth: 0.5, borderColor: '#6C63FF', borderRadius: 8, padding: 6, fontSize: 14, width: 70, textAlign: 'right' },
  saveBtn:            { backgroundColor: '#6C63FF', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  saveBtnText:        { color: '#fff', fontSize: 12, fontWeight: '600' },
  deleteBtn:          { padding: 4 },
  deleteBtnText:      { fontSize: 16 },
  deleteConfirm:      { backgroundColor: '#FEF2F2', marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: '#EF4444' },
  deleteConfirmText:  { fontSize: 13, color: '#991B1B', marginBottom: 10 },
  deleteConfirmBtns:  { flexDirection: 'row', gap: 10 },
  cancelBtn:          { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelBtnText:      { fontSize: 13, color: '#374151', fontWeight: '600' },
  confirmDeleteBtn:   { flex: 1, backgroundColor: '#EF4444', borderRadius: 8, padding: 10, alignItems: 'center' },
  confirmDeleteText:  { fontSize: 13, color: '#fff', fontWeight: '600' },
  saveAllBtn:         { backgroundColor: '#6C63FF', margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveAllText:        { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Modal
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
  backgroundColor: '#fff',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 24,
  maxHeight: '85%',
  flexDirection: 'column',
},
  modalTitle:         { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 16, textAlign: 'center' },
  modalLabel:         { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  modalInput:         { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16, color: '#1a1a2e' },
  emojiGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  emojiOption:        { width: 42, height: 42, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  emojiSelected:      { borderColor: '#6C63FF', backgroundColor: '#EDE9FE' },
  emojiOptionText:    { fontSize: 20 },
  previewRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 20, gap: 8 },
  previewLabel:       { fontSize: 13, color: '#888' },
  previewEmoji:       { fontSize: 22 },
  previewName:        { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  modalBtns: {
  flexDirection: 'row',
  gap: 12,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: '#F3F4F6',
  marginTop: 6,
},
  modalCancelBtn:     { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText:    { fontSize: 15, color: '#374151', fontWeight: '600' },
  modalSaveBtn:       { flex: 1, backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSaveText:      { fontSize: 15, color: '#fff', fontWeight: '600' },
});