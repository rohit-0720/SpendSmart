import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../components/AppStateClean';

const categoryColors = {
  'Food & Dining': '#F59E0B',
  Transport: '#6C63FF',
  Shopping: '#10B981',
  'Rent & Bills': '#3ECFCF',
  Entertainment: '#EC4899',
  Health: '#EF4444',
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
});

const formatDisplayDate = (fullDate) => {
  if (!fullDate) return '';
  const date = new Date(fullDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function TransactionsScreen({ onBack, theme }) {
  const colors = getPalette(theme);
  const { expenses, deleteExpenses } = useApp();
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate));

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleDelete = () => {
    if (selected.length === 0) return;
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    deleteExpenses(selected);
    setSelected([]);
    setEditMode(false);
    setShowConfirm(false);
  };

  const handleEditToggle = () => {
    setEditMode((prev) => !prev);
    setSelected([]);
    setShowConfirm(false);
  };

  const selectAll = () => {
    if (selected.length === sortedExpenses.length) {
      setSelected([]);
    } else {
      setSelected(sortedExpenses.map((expense) => expense.id));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>{'\u2039 Back'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Transactions</Text>
        <TouchableOpacity onPress={handleEditToggle} style={styles.editBtn}>
          <Text style={[styles.editText, { color: colors.accent }]}>{editMode ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {editMode ? (
        <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
          <TouchableOpacity onPress={selectAll}>
            <Text style={[styles.toolbarBtn, { color: colors.accent }]}>
              {selected.length === sortedExpenses.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.selectedCount, { color: colors.textMuted }]}>{`${selected.length} selected`}</Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.deleteBtn, { backgroundColor: '#FEE2E2' }, selected.length === 0 && styles.deleteBtnDisabled]}
            disabled={selected.length === 0}
          >
            <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showConfirm ? (
        <View style={[styles.confirmBox, { backgroundColor: colors.surface, borderColor: colors.danger }]}> 
          <Text style={[styles.confirmTitle, { color: colors.text }]}>{`Delete ${selected.length} expense${selected.length > 1 ? 's' : ''}?`}</Text>
          <Text style={[styles.confirmSub, { color: colors.textMuted }]}>This cannot be undone.</Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowConfirm(false)}>
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmDeleteBtn, { backgroundColor: colors.danger }]} onPress={confirmDelete}>
              <Text style={styles.confirmDeleteText}>Yes, Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 30 }}>
        {sortedExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={46} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No transactions yet</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>Add your first expense from the Add tab.</Text>
          </View>
        ) : (
          sortedExpenses.map((txn) => {
            const isSelected = selected.includes(txn.id);
            const catColor = categoryColors[txn.category] || colors.textMuted;
            return (
              <TouchableOpacity
                key={txn.id}
                style={[
                  styles.txnRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { backgroundColor: colors.surfaceElevated, borderColor: colors.accent },
                ]}
                onPress={() => editMode && toggleSelect(txn.id)}
                activeOpacity={editMode ? 0.7 : 1}
              >
                {editMode ? (
                  <View style={[styles.checkbox, { borderColor: colors.border }, isSelected && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                    {isSelected ? <Text style={styles.checkmark}>?</Text> : null}
                  </View>
                ) : null}

                <View style={[styles.emojiBox, { backgroundColor: `${catColor}20` }]}>
                  <Text style={styles.txnEmoji}>{txn.emoji}</Text>
                </View>

                <View style={styles.txnInfo}>
                  <Text style={[styles.txnName, { color: colors.text }]}>{txn.name}</Text>
                  <View style={styles.txnMeta}>
                    <View style={[styles.catBadge, { backgroundColor: `${catColor}20` }]}>
                      <Text style={[styles.catBadgeText, { color: catColor }]}>{txn.category}</Text>
                    </View>
                    <Text style={[styles.txnDate, { color: colors.textMuted }]}>{formatDisplayDate(txn.fullDate)}</Text>
                  </View>
                </View>

                <Text style={[styles.txnAmount, { color: colors.text }]}>{`-\u20B9${txn.amount.toLocaleString('en-IN')}`}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { minWidth: 60 },
  backText: { fontSize: 18, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  editBtn: { minWidth: 60, alignItems: 'flex-end' },
  editText: { fontSize: 15, fontWeight: '700' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  toolbarBtn: { fontSize: 14, fontWeight: '700' },
  selectedCount: { fontSize: 14 },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 99 },
  deleteBtnDisabled: { opacity: 0.4 },
  deleteBtnText: { fontSize: 13, fontWeight: '700' },
  confirmBox: { margin: 16, borderRadius: 16, padding: 20, borderWidth: 1 },
  confirmTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  confirmSub: { fontSize: 13, marginBottom: 16 },
  confirmBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
  confirmDeleteBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  confirmDeleteText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  list: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  emptySubText: { fontSize: 14 },
  txnRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, borderRadius: 18, padding: 14, gap: 12, borderWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 99, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emojiBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txnEmoji: { fontSize: 20 },
  txnInfo: { flex: 1 },
  txnName: { fontSize: 14, fontWeight: '700', marginBottom: 5 },
  txnMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 99 },
  catBadgeText: { fontSize: 11, fontWeight: '700' },
  txnDate: { fontSize: 11 },
  txnAmount: { fontSize: 15, fontWeight: '700' },
});
