import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from './screens/DashboardFinalScreen';
import AddExpenseScreen from './screens/AddExpenseFinalScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import BudgetScreen from './screens/BudgetScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import AuthLoginScreen from './screens/AuthLoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import { AppProvider } from './components/AppStateClean';
import { AuthProvider, useAuth } from './components/AuthContext';

const Tab = createBottomTabNavigator();

const THEMES = {
  dark: {
    key: 'dark',
    background: '#000000',
    surface: '#0F0F10',
    surfaceElevated: '#141415',
    card: '#101011',
    cardSoft: '#18181A',
    text: '#F8FAFC',
    textMuted: '#A1A1AA',
    border: '#232326',
    accent: '#F8FAFC',
    accentSoft: '#2A2A2E',
    success: '#22C55E',
    danger: '#FF5D73',
    tabBar: '#121212',
    tabPill: '#34343A',
    input: '#11182A',
    chip: '#182038',
    shadow: '#000000',
    statusBar: 'light-content',
    navigation: NavigationDarkTheme,
  },
  light: {
    key: 'light',
    background: '#F7F9FC',
    surface: '#FFFFFF',
    surfaceElevated: '#EEF8FF',
    card: '#FFFFFF',
    cardSoft: '#EAF7FF',
    text: '#171717',
    textMuted: '#7A7A7A',
    border: '#E7EDF5',
    accent: '#22B7E8',
    accentSoft: '#8ADAF2',
    success: '#16A34A',
    danger: '#EF4444',
    tabBar: '#FFFFFF',
    tabPill: '#E7E7EC',
    input: '#FBFDFF',
    chip: '#F3F8FC',
    shadow: '#0F172A',
    statusBar: 'dark-content',
    navigation: NavigationDefaultTheme,
  },
};

const TAB_META = {
  Home: {
    label: 'Home',
    renderIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
  },
  Add: {
    label: 'Add',
    renderIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="plus-circle-outline" size={size} color={color} />
    ),
  },
  Analytics: {
    label: 'Stats',
    renderIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="chart-box-outline" size={size} color={color} />
    ),
  },
  Budget: {
    label: 'Plan',
    renderIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="wallet-outline" size={size} color={color} />
    ),
  },
};

function PremiumTabIcon({ routeName, focused, color, theme }) {
  const meta = TAB_META[routeName];
  if (!meta) return null;

  if (focused) {
    return (
      <View style={styles.tabIconShell}>
        <View
          style={[
            styles.tabPillFocused,
            { backgroundColor: theme.tabPill },
          ]}
        >
          {meta.renderIcon({ color, size: 25 })}
          <Text style={[styles.tabLabel, { color }]}>{meta.label}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabIconShell}>
      <View style={styles.tabPillIdle}>
        {meta.renderIcon({ color, size: 25 })}
      </View>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation, theme }) {
  const color = theme.key === 'dark' ? '#FFFFFF' : '#121212';

  return (
    <View style={[styles.tabBar, { backgroundColor: theme.tabBar, shadowColor: theme.shadow }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <View key={route.key} style={styles.tabButton}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabPressTarget}
              activeOpacity={0.9}
            >
              <PremiumTabIcon routeName={route.name} focused={focused} color={color} theme={theme} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

function HeaderActions({ theme, onOpenSettings }) {
  return (
    <View style={styles.headerActions}>
      <TouchableOpacity
        onPress={onOpenSettings}
        style={[styles.settingsButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
      >
        <Ionicons name="settings-outline" size={18} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

function MainApp() {
  const { user, signOut, loading } = useAuth();
  const [showTransactions, setShowTransactions] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [themeName, setThemeName] = useState('dark');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const theme = THEMES[themeName];
  const currentHour = new Date().getHours();
  const firstNameSource = user?.displayName || user?.email?.split('@')[0] || 'there';
  const firstName = firstNameSource.split(' ')[0];
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  const navigationTheme = useMemo(() => ({
    ...theme.navigation,
    colors: {
      ...theme.navigation.colors,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.accent,
    },
  }), [theme]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading SpendSmart...</Text>
      </View>
    );
  }

  if (!user) {
    if (showForgotPassword) {
      return <ForgotPasswordScreen onBack={() => setShowForgotPassword(false)} />;
    }

    return <AuthLoginScreen onForgotPassword={() => setShowForgotPassword(true)} />;
  }

  if (showTransactions) {
    return <TransactionsScreen onBack={() => setShowTransactions(false)} theme={theme} />;
  }

  const headerRight = () => (
    <HeaderActions
      theme={theme}
      onOpenSettings={() => setSettingsVisible(true)}
    />
  );

  const headerLeft = () => (
    <View style={styles.greetingWrap}>
      <Text numberOfLines={1} style={[styles.greetingText, { color: theme.text }]}>{`${greeting}, ${firstName}`}</Text>
    </View>
  );

  return (
    <View style={[styles.appShell, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.surface}
      />
      <NavigationContainer theme={navigationTheme}>
      <Modal
        transparent
        visible={settingsVisible}
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable style={styles.settingsOverlay} onPress={() => setSettingsVisible(false)}>
          <Pressable
            style={[
              styles.settingsSheet,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => {}}
          >
            <View style={[styles.settingsRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.settingsLabel, { color: theme.textMuted }]}>Mail :</Text>
              <Text style={[styles.settingsValue, { color: theme.text }]}>
                {user.email || user.displayName || 'Signed in'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.settingsActionRow, { borderBottomColor: theme.border }]}
              onPress={() => setThemeName((current) => (current === 'dark' ? 'light' : 'dark'))}
            >
              <View>
                <Text style={[styles.settingsLabel, { color: theme.textMuted }]}>Theme</Text>
                <Text style={[styles.settingsValue, { color: theme.text }]}>
                  {theme.key === 'dark' ? 'Dark mode' : 'Light mode'}
                </Text>
              </View>
              <View
                style={[
                  styles.settingsIconBubble,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                ]}
              >
                <Ionicons
                  name={theme.key === 'dark' ? 'sunny-outline' : 'moon-outline'}
                  size={18}
                  color={theme.text}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsRow, { borderBottomColor: theme.border }]}
              onPress={() => {
                setSettingsVisible(false);
                signOut();
              }}
            >
              <Text style={[styles.settingsLabel, { color: theme.textMuted }]}>Account</Text>
              <Text style={[styles.settingsLogout, { color: theme.danger }]}>Log out</Text>
            </TouchableOpacity>

            <View style={styles.settingsFooter}>
              <Text style={[styles.settingsDeveloper, { color: theme.textMuted }]}>
                Developed By Rohit
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} theme={theme} />}
        screenOptions={({ route }) => ({
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          sceneStyle: { backgroundColor: theme.background },
          headerStyle: { backgroundColor: theme.surface, shadowColor: 'transparent', elevation: 0 },
          headerTitle: '',
          headerTitleStyle: { color: theme.text, fontSize: 18, fontWeight: '700' },
          headerShadowVisible: false,
          headerLeft,
          headerRight,
        })}
      >
        <Tab.Screen
          name="Home"
          options={{ title: 'Home' }}
          children={() => <DashboardScreen onViewAll={() => setShowTransactions(true)} theme={theme} />}
        />
        <Tab.Screen
          name="Add"
          options={{ title: 'Add Expense' }}
          children={() => <AddExpenseScreen theme={theme} />}
        />
        <Tab.Screen
          name="Analytics"
          options={{ title: 'Analytics' }}
          children={() => <AnalyticsScreen theme={theme} />}
        />
        <Tab.Screen
          name="Budget"
          options={{ title: 'Budget' }}
          children={() => <BudgetScreen theme={theme} />}
        />
      </Tab.Navigator>
      </NavigationContainer>
    </View>
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
  appShell: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
    maxWidth: 280,
  },
  greetingWrap: {
    marginLeft: 14,
    maxWidth: 220,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 86,
    paddingRight: 14,
  },
  settingsSheet: {
    width: 264,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingsActionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingsValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingsLogout: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingsFooter: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsDeveloper: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingsIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
    elevation: 16,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    backgroundColor: 'transparent',
  },
  tabPressTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconShell: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  tabPillFocused: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 22,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabPillIdle: {
    width: 48,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});
