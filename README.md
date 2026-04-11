# SpendSmart

SpendSmart is a cross-platform personal finance app built with Expo and React Native. It helps users set a monthly budget, organize category allocations, track expenses and review insights.



<img width="1919" height="994" alt="image" src="https://github.com/user-attachments/assets/a8c2073e-95e4-43b5-95d8-e68bfb5fe4b9" />


## Highlights

- Email/password authentication with Firebase
- Google sign-in support for web and Android
- Light and dark theme support
- Monthly budget setup with editable category allocations
- Smart savings-aware budget distribution
- Expense entry with category selection and date picker
- Analytics view for budget usage and category tracking
- Recent transactions list
- Responsive Expo web support

## Tech Stack

- Expo SDK 51
- React Native 0.74
- React Navigation
- Firebase Authentication
- Firebase Firestore
- Expo Auth Session
- React Native Google Sign-In

## App Flow

The app currently uses these active screens:

- Home dashboard
- Add expense
- Analytics
- Budget planner
- Transactions
- Login
- Forgot password

Authentication and app data are handled through:

- `components/AuthContext.js`
- `components/AppStateClean.js`
- `firebase/firebaseConfig.js`
- `firebase/firebaseService.js`

## Features

### Authentication

- Sign up with email and password
- Sign in with email and password
- Google sign-in
- Password reset flow
- Auth persistence with AsyncStorage

### Budget Management

- Set monthly budget
- Edit category allocations
- Add custom categories
- Rename categories and choose icons
- Auto-suggest budget split using a guided rule
- Preserve a savings buffer while adjusting allocations

### Expense Tracking

- Add expenses by category
- Attach date to each transaction
- See recent transactions
- Save expenses to Firebase per user

### Insights

- Category allocation tracking
- Monthly spending breakdown
- Budget vs. spent visibility

## Project Structure

```text
SpendSmart/
  android/
  assets/
  components/
    AppStateClean.js
    AuthContext.js
  firebase/
    firebaseConfig.js
    firebaseService.js
  screens/
    AddExpenseFinalScreen.js
    AnalyticsScreen.js
    AuthLoginScreen.js
    BudgetScreen.js
    DashboardFinalScreen.js
    ForgotPasswordScreen.js
    TransactionsScreen.js
  App.js
  app.json
  package.json
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Expo CLI tooling through `npx`
- Android Studio or Android SDK for local Android builds
- Firebase project with Authentication and Firestore enabled

### Install dependencies

```bash
npm install
```

### Start the project

```bash
npx expo start
```

### Run on web

```bash
npx expo start --web
```

## Firebase Setup

You need a Firebase project configured for this app.

Required services:

- Firebase Authentication
- Firestore Database

Recommended providers:

- Email/Password
- Google

Also make sure your Android package and SHA fingerprints are configured correctly in Firebase if you plan to use Google sign-in in Android builds.


### Expo local Android run

```bash
npx expo run:android --variant release
```

### EAS cloud build

```bash
eas build -p android --profile preview
```


## Notes

- Web and Android use different Google sign-in paths, so Firebase and OAuth configuration must be aligned carefully.
- Android release builds may require release SHA registration in Firebase for Google sign-in to work correctly.
- The UI includes both light and dark themes with a custom tab bar and themed authentication screen.


Spend Smart Apk(Andoid) - https://drive.google.com/file/d/1lD89mFg6lBNoVP3t26hCy_OIuk2YEuen/view?usp=sharing


## Author

Developed by Rohit ;)
