import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { Text } from 'react-native';
import DashboardScreen    from './screens/DashboardScreen';
import AddExpenseScreen   from './screens/AddExpenseScreen';
import AnalyticsScreen    from './screens/AnalyticsScreen';
import BudgetScreen       from './screens/BudgetScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import { AppProvider }    from './components/AppContext';

const Tab = createBottomTabNavigator();

const icons = {
  Home:      '🏠',
  Add:       '➕',
  Analytics: '📊',
  Budget:    '💰',
};

function MainApp() {
  const [showTransactions, setShowTransactions] = useState(false);

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
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}