# Firebase Setup Instructions / הוראות הגדרת Firebase

## עברית

### שלב 1: יצירת פרויקט Firebase

1. עבור ל-[Firebase Console](https://console.firebase.google.com/)
2. לחץ על "הוסף פרויקט" (Add Project)
3. תן שם לפרויקט (לדוגמה: "forum-celiac")
4. בחר אם להפעיל Google Analytics (אופציונלי)
5. לחץ על "צור פרויקט"

### שלב 2: הגדרת Authentication

1. בקונסול של Firebase, עבור ל-"Authentication" בתפריט הצד
2. לחץ על "Get Started"
3. בלשונית "Sign-in method", הפעל את "Email/Password"
4. שמור את השינויים

### שלב 3: הגדרת Firestore Database

1. בקונסול של Firebase, עבור ל-"Firestore Database" בתפריט הצד
2. לחץ על "Create database"
3. בחר "Start in production mode" (נשנה את הכללים בהמשך)
4. בחר מיקום גיאוגרפי (מומלץ: europe-west)
5. לחץ על "Enable"

### שלב 4: הגדרת כללי אבטחה ל-Firestore

ב-Firestore Database, עבור ל-"Rules" והחלף את הכללים בקוד הבא (או העתק מהקובץ `firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAuthor(resource) {
      return isSignedIn() && (
        resource.data.Email == request.auth.token.email ||
        resource.data.Username == request.auth.token.email.split('@')[0]
      );
    }
    
    // Users collection - document ID must match user UID
    match /users/{userId} {
      allow read: if true;
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update, delete: if isSignedIn() && request.auth.uid == userId;
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['Likes']) &&
         request.resource.data.Likes > resource.data.Likes) ||
        isAuthor(resource)
      );
      allow delete: if isAuthor(resource);
    }
    
    // Contacts collection
    match /contacts/{contactId} {
      allow read: if false;
      allow create: if true;
      allow update, delete: if false;
    }
  }
}
```

### שלב 5: קבלת מפתחות ההגדרה

1. בקונסול של Firebase, לחץ על סמל ההגדרות (⚙️) ליד "Project Overview"
2. בחר "Project settings"
3. גלול למטה ל-"Your apps"
4. לחץ על "Add app" ובחר את סמל האינטרנט (</>)
5. תן שם לאפליקציה (לדוגמה: "Forum Web App")
6. העתק את אובייקט `firebaseConfig`

### שלב 6: עדכון הקוד

פתח את הקובץ `index.html` ומצא את השורות הבאות (בסביבות שורה 18-30):

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

החלף את הערכים האלה בערכים שהעתקת מ-Firebase Console.

### שלב 7: יצירת אינדקסים ל-Firestore

כדי לאפשר שאילתות יעילות, נצטרך ליצור אינדקס:

1. עבור ל-Firestore Database
2. עבור ל-"Indexes"
3. לחץ על "Create Index"
4. הגדר:
   - Collection ID: `posts`
   - Fields to index:
     - Field: `Timestamp`, Order: `Descending`
     - Field: `Category`, Order: `Ascending` (אופציונלי)
5. לחץ על "Create"

### שלב 8: פריסה (Deployment)

1. שמור את כל השינויים ב-`index.html`
2. העלה את הקובץ לשרת האירוח שלך
3. בדוק שהכל עובד

### מבנה הנתונים ב-Firestore

#### Collections:

1. **users** - מידע על משתמשים רשומים
   - **Document ID**: uid מ-Firebase Auth (חשוב!)
   - `username`: שם המשתמש
   - `email`: כתובת האימייל
   - `createdAt`: תאריך יצירת החשבון

2. **posts** - הודעות ותגובות בפורום
   - **Document ID**: נוצר אוטומטית
   - `Name`: שם המשתמש
   - `Username`: שם המשתמש (זהה ל-Name)
   - `Email`: אימייל המשתמש
   - `Category`: קטגוריה (רק להודעות ראשיות)
   - `Subject`: נושא (רק להודעות ראשיות)
   - `Content`: תוכן ההודעה/תגובה
   - `Timestamp`: זמן פרסום
   - `Likes`: מספר לייקים
   - `parentId`: מזהה ההודעה האב (null להודעות ראשיות)

3. **contacts** - הודעות יצירת קשר
   - **Document ID**: נוצר אוטומטית
   - `name`: שם השולח
   - `email`: אימייל השולח
   - `message`: תוכן ההודעה
   - `createdAt`: תאריך השליחה

---

## English

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Give your project a name (e.g., "forum-celiac")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Set Up Authentication

1. In Firebase Console, go to "Authentication" in the sidebar
2. Click "Get Started"
3. In "Sign-in method" tab, enable "Email/Password"
4. Save changes

### Step 3: Set Up Firestore Database

1. In Firebase Console, go to "Firestore Database" in the sidebar
2. Click "Create database"
3. Choose "Start in production mode" (we'll change rules later)
4. Select a location (recommended: europe-west)
5. Click "Enable"

### Step 4: Configure Firestore Security Rules

In Firestore Database, go to "Rules" and replace with (or copy from `firestore.rules` file):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAuthor(resource) {
      return isSignedIn() && (
        resource.data.Email == request.auth.token.email ||
        resource.data.Username == request.auth.token.email.split('@')[0]
      );
    }
    
    // Users collection - document ID must match user UID
    match /users/{userId} {
      allow read: if true;
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update, delete: if isSignedIn() && request.auth.uid == userId;
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['Likes']) &&
         request.resource.data.Likes > resource.data.Likes) ||
        isAuthor(resource)
      );
      allow delete: if isAuthor(resource);
    }
    
    // Contacts collection
    match /contacts/{contactId} {
      allow read: if false;
      allow create: if true;
      allow update, delete: if false;
    }
  }
}
```

### Step 5: Get Configuration Keys

1. In Firebase Console, click the settings icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps"
4. Click "Add app" and choose the web icon (</>)
5. Give your app a name (e.g., "Forum Web App")
6. Copy the `firebaseConfig` object

### Step 6: Update Code

Open `index.html` and find these lines (around line 18-30):

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

Replace these values with those from Firebase Console.

### Step 7: Create Firestore Indexes

To enable efficient queries, create an index:

1. Go to Firestore Database
2. Go to "Indexes"
3. Click "Create Index"
4. Configure:
   - Collection ID: `posts`
   - Fields to index:
     - Field: `Timestamp`, Order: `Descending`
     - Field: `Category`, Order: `Ascending` (optional)
5. Click "Create"

### Step 8: Deploy

1. Save all changes in `index.html`
2. Upload the file to your hosting server
3. Test that everything works

### Firestore Data Structure

#### Collections:

1. **users** - Registered user information
   - **Document ID**: uid from Firebase Auth (important!)
   - `username`: Username
   - `email`: Email address
   - `createdAt`: Account creation date

2. **posts** - Forum posts and replies
   - **Document ID**: Auto-generated
   - `Name`: User name
   - `Username`: Username (same as Name)
   - `Email`: User email
   - `Category`: Category (main posts only)
   - `Subject`: Subject (main posts only)
   - `Content`: Post/reply content
   - `Timestamp`: Publication time
   - `Likes`: Number of likes
   - `parentId`: Parent post ID (null for main posts)

3. **contacts** - Contact form messages
   - **Document ID**: Auto-generated
   - `name`: Sender name
   - `email`: Sender email
   - `message`: Message content
   - `createdAt`: Submission date

---

## Important Security Notes / הערות אבטחה חשובות

- Make sure to configure Firestore security rules properly
- Never commit Firebase credentials to public repositories
- Consider implementing rate limiting for contact forms
- Regularly review Firebase usage and security

---

- יש להגדיר כללי אבטחה של Firestore בצורה נכונה
- לעולם אל תשמור את מפתחות Firebase במאגר ציבורי
- שקול להוסיף הגבלת קצב לטפסי יצירת קשר
- בדוק באופן קבוע את השימוש והאבטחה ב-Firebase
