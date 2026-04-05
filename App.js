import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import DashboardScreen    from './screens/DashboardScreen';
import AddExpenseScreen   from './screens/AddExpenseScreen';
import AnalyticsScreen    from './screens/AnalyticsScreen';
import BudgetScreen       from './screens/BudgetScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import LoginScreen        from './screens/LoginScreen';
import { AppProvider }    from './components/AppContext';
import { AuthProvider, useAuth } from './components/AuthContext';

const Tab = createBottomTabNavigator();

const icons = {
  Home:      '🏠',
  Add:       '➕',
  Analytics: '📊',
  Budget:    '💰',
};

function MainApp() {
  const { user, logout, loading } = useAuth();
  const [showTransactions, setShowTransactions] = useState(false);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading SpendSmart...</Text>
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  // User is logged in - show the app
  if (showTransactions) {
    return <TransactionsScreen onBack={() => setShowTransactions(false)} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#aaa',
        tabBarIcon: ({ size }) => (
          <Text style={{ fontSize: size - 4 }}>{icons[route.name]}</Text>
        ),
        headerRight: () => (
          <View style={styles.headerRight}>
            <Text style={styles.userEmail}>{user.email || user.displayName}</Text>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ),
      })}>
        <Tab.Screen name="Home"      children={() => <DashboardScreen onViewAll={() => setShowTransactions(true)} />} />
        <Tab.Screen name="Add"       component={AddExpenseScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Budget"    component={BudgetScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});