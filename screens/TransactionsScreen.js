import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../components/AppContext';

const categoryColors = {
  'Food & Dining':  '#F59E0B',
  'Transport':      '#6C63FF',
  'Shopping':       '#10B981',
  'Rent & Bills':   '#3ECFCF',
  'Entertainment':  '#EC4899',
  'Health':         '#EF4444',
};

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

export default function TransactionsScreen({ onBack }) {
  const { expenses, deleteExpenses } = useApp();
  const [editMode, setEditMode]       = useState(false);
  const [selected, setSelected]       = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate));

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
    setEditMode(prev => !prev);
    setSelected([]);
    setShowConfirm(false);
  };

  const selectAll = () => {
    if (selected.length === sortedExpenses.length) {
      setSelected([]);
    } else {
      setSelected(sortedExpenses.map(e => e.id));
    }
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Transactions</Text>
        <TouchableOpacity onPress={handleEditToggle} style={styles.editBtn}>
          <Text style={styles.editText}>{editMode ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* Edit mode toolbar */}
      {editMode && (
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={selectAll}>
            <Text style={styles.toolbarBtn}>
              {selected.length === sortedExpenses.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectedCount}>{selected.length} selected</Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.deleteBtn, selected.length === 0 && styles.deleteBtnDisabled]}
            disabled={selected.length === 0}
          >
            <Text style={styles.deleteBtnText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Confirm Dialog */}
      {showConfirm && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>
            Delete {selected.length} expense{selected.length > 1 ? 's' : ''}?
          </Text>
          <Text style={styles.confirmSub}>This cannot be undone.</Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowConfirm(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmDeleteBtn}
              onPress={confirmDelete}
            >
              <Text style={styles.confirmDeleteText}>Yes, Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Transactions list */}
      <ScrollView style={styles.list}>
        {sortedExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubText}>Add your first expense from the Add tab</Text>
          </View>
        ) : (
          sortedExpenses.map((txn) => {
            const isSelected = selected.includes(txn.id);
            const catColor   = categoryColors[txn.category] || '#888';
            return (
              <TouchableOpacity
                key={txn.id}
                style={[styles.txnRow, isSelected && styles.txnRowSelected]}
                onPress={() => editMode && toggleSelect(txn.id)}
                activeOpacity={editMode ? 0.7 : 1}
              >
                {editMode && (
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                )}

                <View style={[styles.emojiBox, { backgroundColor: catColor + '20' }]}>
                  <Text style={styles.txnEmoji}>{txn.emoji}</Text>
                </View>

                <View style={styles.txnInfo}>
                  <Text style={styles.txnName}>{txn.name}</Text>
                  <View style={styles.txnMeta}>
                    <View style={[styles.catBadge, { backgroundColor: catColor + '20' }]}>
                      <Text style={[styles.catBadgeText, { color: catColor }]}>{txn.category}</Text>
                    </View>
                    <Text style={styles.txnDate}>{formatDisplayDate(txn.fullDate)}</Text>
                  </View>
                </View>

                <Text style={styles.txnAmount}>−₹{txn.amount.toLocaleString('en-IN')}</Text>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#F5F5F5' },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  backBtn:           { minWidth: 60 },
  backText:          { fontSize: 18, color: '#6C63FF' },
  headerTitle:       { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  editBtn:           { minWidth: 60, alignItems: 'flex-end' },
  editText:          { fontSize: 15, color: '#6C63FF', fontWeight: '600' },
  toolbar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  toolbarBtn:        { fontSize: 14, color: '#6C63FF' },
  selectedCount:     { fontSize: 14, color: '#888' },
  deleteBtn:         { backgroundColor: '#FEE2E2', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 99 },
  deleteBtnDisabled: { opacity: 0.4 },
  deleteBtnText:     { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  confirmBox:        { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#FEE2E2' },
  confirmTitle:      { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  confirmSub:        { fontSize: 13, color: '#888', marginBottom: 16 },
  confirmBtns:       { flexDirection: 'row', gap: 12 },
  cancelBtn:         { flex: 1, padding: 12, borderRadius: 10, borderWidth: 0.5, borderColor: '#ddd', alignItems: 'center' },
  cancelText:        { fontSize: 14, color: '#555' },
  confirmDeleteBtn:  { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center' },
  confirmDeleteText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  list:              { flex: 1 },
  emptyState:        { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:        { fontSize: 48, marginBottom: 12 },
  emptyText:         { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginBottom: 6 },
  emptySubText:      { fontSize: 14, color: '#888' },
  txnRow:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 14, gap: 12 },
  txnRowSelected:    { backgroundColor: '#EDE9FE', borderWidth: 1, borderColor: '#6C63FF' },
  checkbox:          { width: 22, height: 22, borderRadius: 99, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected:  { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  checkmark:         { color: '#fff', fontSize: 13, fontWeight: '700' },
  emojiBox:          { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txnEmoji:          { fontSize: 20 },
  txnInfo:           { flex: 1 },
  txnName:           { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 5 },
  txnMeta:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge:          { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 99 },
  catBadgeText:      { fontSize: 11, fontWeight: '600' },
  txnDate:           { fontSize: 11, color: '#aaa' },
  txnAmount:         { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
});