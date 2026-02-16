# הוראות התקנה של Google Apps Script למתכונים

## עברית

### שלב 1: יצירת Google Spreadsheet חדש

1. היכנס ל-[Google Sheets](https://sheets.google.com)
2. צור Spreadsheet חדש
3. תן לו שם מתאים (לדוגמה: "Forum with Recipes")

### שלב 2: הוספת הקוד ל-Apps Script

1. בגיליון האלקטרוני, לחץ על **Extensions > Apps Script**
2. מחק את הקוד הקיים
3. העתק את כל התוכן מקובץ `Code.gs`
4. הדבק אותו בעורך Apps Script
5. לחץ על **שמור** (Ctrl+S / Cmd+S)

### שלב 3: פריסה כ-Web App

1. לחץ על **Deploy > New deployment**
2. בחר **Web app** כסוג הפריסה
3. הגדרות:
   - **Description**: "Forum Recipes API v1"
   - **Execute as**: Me
   - **Who has access**: Anyone
4. לחץ **Deploy**
5. אשר את ההרשאות הנדרשות
6. העתק את ה-**Web app URL** שמתקבל

### שלב 4: עדכון ה-SCRIPT_URL ב-index.html

1. פתח את `index.html`
2. חפש את השורה עם `const SCRIPT_URL`
3. החלף את ה-URL הקיים ב-URL שקיבלת בשלב הקודם

```javascript
const SCRIPT_URL = "YOUR_NEW_WEB_APP_URL_HERE";
```

### שלב 5: בדיקה

1. טען את העמוד מחדש
2. לחץ על כפתור ה-🍳 בצד ימין
3. נסה להוסיף מתכון
4. וודא שהמתכון מופיע ב-Google Sheets
5. נסה לתת לייק למתכון

## מבנה הגיליון האלקטרוני

הסקריפט יוצר אוטומטית שני גיליונות:

### גיליון "Forum" (קיים)
- ID
- Name
- Username
- Email
- Category
- Subject
- Content
- Timestamp
- Likes
- ParentID

### גיליון "Recipes" (חדש)
- id
- mainTitle
- subTitle
- prepTime
- servings
- ingredientsJson
- instructionsJson
- username
- email
- date
- likes

## תכונות

✅ הוספת מתכונים עם:
- שם משתמש ואימייל
- כותרת ראשית ומשנית
- זמן הכנה וכמות מנות
- רשימת מרכיבים דינמית
- רשימת שלבי הכנה דינמית

✅ תצוגת מתכונים מעוצבת

✅ לייקים למתכונים

✅ אימייל אוטומטי למשתמש שמוסיף מתכון

✅ תמיכה מלאה ב-RTL (עברית)

## פתרון בעיות

### שגיאה: "Script not found"
- ודא שפרסת את הסקריפט כ-Web App
- ודא שנתת הרשאה "Anyone" לגישה

### המתכון לא נשמר
- בדוק את Console בדפדפן (F12) לשגיאות
- ודא ש-SCRIPT_URL נכון
- בדוק את Logs ב-Apps Script

### אימייל לא נשלח
- ודא שהאימייל שהוזן תקין
- בדוק את ה-Logs ב-Apps Script
- ייתכן שיש צורך באישור נוסף לשליחת אימיילים

---

# Google Apps Script Installation Instructions for Recipes

## English

### Step 1: Create a New Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new Spreadsheet
3. Name it appropriately (e.g., "Forum with Recipes")

### Step 2: Add the Code to Apps Script

1. In the spreadsheet, click **Extensions > Apps Script**
2. Delete the existing code
3. Copy all content from `Code.gs`
4. Paste it in the Apps Script editor
5. Click **Save** (Ctrl+S / Cmd+S)

### Step 3: Deploy as Web App

1. Click **Deploy > New deployment**
2. Select **Web app** as the deployment type
3. Settings:
   - **Description**: "Forum Recipes API v1"
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Authorize the required permissions
6. Copy the **Web app URL** you receive

### Step 4: Update SCRIPT_URL in index.html

1. Open `index.html`
2. Find the line with `const SCRIPT_URL`
3. Replace the existing URL with the one from the previous step

```javascript
const SCRIPT_URL = "YOUR_NEW_WEB_APP_URL_HERE";
```

### Step 5: Test

1. Reload the page
2. Click the 🍳 button on the right side
3. Try adding a recipe
4. Verify the recipe appears in Google Sheets
5. Try liking a recipe

## Spreadsheet Structure

The script automatically creates two sheets:

### "Forum" Sheet (existing)
- ID
- Name
- Username
- Email
- Category
- Subject
- Content
- Timestamp
- Likes
- ParentID

### "Recipes" Sheet (new)
- id
- mainTitle
- subTitle
- prepTime
- servings
- ingredientsJson
- instructionsJson
- username
- email
- date
- likes

## Features

✅ Add recipes with:
- Username and email
- Main and subtitle
- Prep time and servings
- Dynamic ingredients list
- Dynamic instruction steps

✅ Styled recipe display

✅ Recipe likes

✅ Automatic email to user who adds recipe

✅ Full RTL (Hebrew) support

## Troubleshooting

### Error: "Script not found"
- Ensure you deployed the script as a Web App
- Ensure you gave "Anyone" access permission

### Recipe not saving
- Check Console in browser (F12) for errors
- Ensure SCRIPT_URL is correct
- Check Logs in Apps Script

### Email not sent
- Ensure the email entered is valid
- Check Logs in Apps Script
- Additional authorization may be needed for sending emails
