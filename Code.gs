/**
 * Google Apps Script backend for the forum.
 *
 * Important: This project is deployed as a standalone Web App,
 * so we must open the spreadsheet by ID (not getActiveSpreadsheet).
 */

const SPREADSHEET_ID = '1qIBLUTPXSPv8hEHS7srxSj3poTTXBlYq2zo_ErrHdWE';
const COMMENTS_SHEET_NAME = 'Comments';
const USERS_SHEET_NAME = 'Users';
const CONTACT_SHEET_NAME = 'Contact';
const RECIPES_SHEET_NAME = 'Recipes';

function doGet(e) {
  try {
    const action = safeString(e && e.parameter && e.parameter.action) || 'list';

    if (action === 'recipeList') return jsonResponse(getRecipesListObj());
    if (action === 'health') return jsonResponse(healthStatusObj());

    // default endpoint used by the website for loading forum posts
    return jsonResponse(getForumPostsObj());
  } catch (error) {
    return jsonResponse({ status: 'error', message: String(error) });
  }
}

function doPost(e) {
  try {
    const params = parseRequestBody(e);
    const action = safeString(params.action) || 'post';

    if (action === 'recipe') return jsonResponse(withLock(function() { return addRecipeObj(params); }));
    if (action === 'recipeList') return jsonResponse(getRecipesListObj());
    if (action === 'recipeLike') return jsonResponse(withLock(function() { return addRecipeLikeObj(params); }));
    if (action === 'register') return jsonResponse(withLock(function() { return registerUserObj(params); }));
    if (action === 'checkUser') return jsonResponse(checkUserObj(params));
    if (action === 'contact') return jsonResponse(withLock(function() { return addContactObj(params); }));
    if (action === 'like') return jsonResponse(withLock(function() { return addLikeObj(params); }));
    if (action === 'delete' || action === 'deleteReply') return jsonResponse(withLock(function() { return deletePostObj(params); }));

    return jsonResponse(withLock(function() { return addForumPostObj(params); }));
  } catch (error) {
    return jsonResponse({ status: 'error', message: String(error) });
  }
}

function parseRequestBody(e) {
  if (!e) return {};

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      return e.parameter || {};
    }
  }

  return e.parameter || {};
}


function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    // fallback for bound-script dev mode
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    return sheet;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function normalizeHeader(s) {
  return String(s || '').trim().toLowerCase();
}

function buildHeaderIndex(headers) {
  const idx = {};
  headers.forEach((h, i) => {
    idx[normalizeHeader(h)] = i;
  });
  return idx;
}

function getIndex(headerIndex, aliases) {
  for (let i = 0; i < aliases.length; i++) {
    const key = normalizeHeader(aliases[i]);
    if (headerIndex[key] !== undefined) return headerIndex[key];
  }
  return -1;
}

function getForumPostsObj() {
  const sheet = getOrCreateSheet(COMMENTS_SHEET_NAME, [
    'ID', 'ParentID', 'Category', 'Name', 'Email', 'Subject', 'Content', 'Timestamp', 'Likes'
  ]);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);
  const h = buildHeaderIndex(headers);

  const idCol = getIndex(h, ['ID', 'id']);
  const parentCol = getIndex(h, ['ParentID', 'parentId']);
  const categoryCol = getIndex(h, ['Category', 'category']);
  const nameCol = getIndex(h, ['Name', 'name', 'Username', 'username']);
  const emailCol = getIndex(h, ['Email', 'email']);
  const subjectCol = getIndex(h, ['Subject', 'subject']);
  const contentCol = getIndex(h, ['Content', 'content']);
  const timeCol = getIndex(h, ['Timestamp', 'timestamp', 'Date', 'date']);
  const likesCol = getIndex(h, ['Likes', 'likes']);

  return rows
    .map(row => ({
      ID: idCol >= 0 ? row[idCol] : '',
      ParentID: parentCol >= 0 ? row[parentCol] : '',
      Category: categoryCol >= 0 ? row[categoryCol] : '',
      Name: nameCol >= 0 ? row[nameCol] : '',
      Email: emailCol >= 0 ? row[emailCol] : '',
      Subject: subjectCol >= 0 ? row[subjectCol] : '',
      Content: contentCol >= 0 ? row[contentCol] : '',
      Timestamp: timeCol >= 0 ? row[timeCol] : '',
      Likes: likesCol >= 0 ? row[likesCol] : 0
    }))
    .filter(post => post.ID);
}

function addForumPostObj(data) {
  const name = safeString(data.name || data.username);
  const email = safeString(data.email);
  const category = safeString(data.category);
  const subject = safeString(data.subject);
  const content = safeString(data.content);
  const parentId = safeString(data.parentId);

  if (!name) return { status: 'error', message: 'שם משתמש חובה' };
  if (!content || content.length < 2) return { status: 'error', message: 'תוכן קצר מדי' };

  const sheet = getOrCreateSheet(COMMENTS_SHEET_NAME, [
    'ID', 'ParentID', 'Category', 'Name', 'Email', 'Subject', 'Content', 'Timestamp', 'Likes'
  ]);

  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const h = buildHeaderIndex(headerRow);
  const row = new Array(headerRow.length).fill('');

  const id = Utilities.getUuid();
  const timestamp = new Date().toISOString();

  const setIfExists = function(aliases, value) {
    const col = getIndex(h, aliases);
    if (col >= 0) row[col] = value;
  };

  setIfExists(['ID', 'id'], id);
  setIfExists(['ParentID', 'parentId'], parentId);
  setIfExists(['Category', 'category'], category);
  setIfExists(['Name', 'name', 'Username', 'username'], name);
  setIfExists(['Email', 'email'], email);
  setIfExists(['Subject', 'subject'], subject);
  setIfExists(['Content', 'content'], content);
  setIfExists(['Timestamp', 'timestamp', 'Date', 'date'], timestamp);
  setIfExists(['Likes', 'likes'], 0);

  sheet.appendRow(row);

  return { status: 'success', id: id, message: 'הפוסט נוסף בהצלחה' };
}

function addLikeObj(data) {
  const id = safeString(data.id);
  if (!id) return { status: 'error', message: 'missing id' };

  const sheet = getOrCreateSheet(COMMENTS_SHEET_NAME, [
    'ID', 'ParentID', 'Category', 'Name', 'Email', 'Subject', 'Content', 'Timestamp', 'Likes'
  ]);

  const allData = sheet.getDataRange().getValues();
  if (allData.length <= 1) return { status: 'error', message: 'not found' };

  const h = buildHeaderIndex(allData[0]);
  const idIndex = getIndex(h, ['ID', 'id']);
  const likesIndex = getIndex(h, ['Likes', 'likes']);

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][idIndex]) === id) {
      const currentLikes = parseInt(allData[i][likesIndex] || 0, 10);
      sheet.getRange(i + 1, likesIndex + 1).setValue((isNaN(currentLikes) ? 0 : currentLikes) + 1);
      return { status: 'success' };
    }
  }

  return { status: 'error', message: 'not found' };
}

function deletePostObj(data) {
  const id = safeString(data.id);
  if (!id) return { status: 'error', message: 'missing id' };

  const sheet = getOrCreateSheet(COMMENTS_SHEET_NAME, [
    'ID', 'ParentID', 'Category', 'Name', 'Email', 'Subject', 'Content', 'Timestamp', 'Likes'
  ]);

  const allData = sheet.getDataRange().getValues();
  const h = buildHeaderIndex(allData[0] || []);
  const idIndex = getIndex(h, ['ID', 'id']);

  for (let i = allData.length - 1; i >= 1; i--) {
    if (String(allData[i][idIndex]) === id) {
      sheet.deleteRow(i + 1);
    }
  }

  return { status: 'success' };
}

function getUsersSheet() {
  return getOrCreateSheet(USERS_SHEET_NAME, ['Username', 'Email', 'RegisterDate']);
}

function registerUserObj(data) {
  const username = safeString(data.username || data.name);
  const email = safeString(data.email);

  if (!username) return { status: 'error', message: 'שם משתמש חובה' };

  const sheet = getUsersSheet();
  const values = sheet.getDataRange().getValues();
  const h = buildHeaderIndex(values[0] || []);
  const usernameCol = getIndex(h, ['Username', 'username', 'Name', 'name']);
  const emailCol = getIndex(h, ['Email', 'email']);
  const dateCol = getIndex(h, ['RegisterDate', 'Date', 'date']);

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][usernameCol]).trim() === username) {
      return { status: 'success', message: 'המשתמש כבר רשום', exists: true };
    }
  }

  const row = new Array(values[0].length).fill('');
  if (usernameCol >= 0) row[usernameCol] = username;
  if (emailCol >= 0) row[emailCol] = email;
  if (dateCol >= 0) row[dateCol] = new Date();
  sheet.appendRow(row);

  return { status: 'success', message: 'נרשמת בהצלחה!', exists: false };
}

function checkUserObj(data) {
  const username = safeString(data.username || data.name);
  if (!username) return { status: 'error', message: 'שם משתמש חובה' };

  const sheet = getUsersSheet();
  const values = sheet.getDataRange().getValues();
  const h = buildHeaderIndex(values[0] || []);
  const usernameCol = getIndex(h, ['Username', 'username', 'Name', 'name']);

  const exists = values.some((row, idx) => idx > 0 && String(row[usernameCol]).trim() === username);
  return { status: 'success', exists: exists };
}

function getContactSheet() {
  return getOrCreateSheet(CONTACT_SHEET_NAME, ['Date', 'Name', 'Email', 'Message']);
}

function addContactObj(data) {
  const name = safeString(data.name) || 'אנונימי';
  const email = safeString(data.email);
  const message = safeString(data.message);

  if (!message || message.length < 3) {
    return { status: 'error', message: 'ההודעה קצרה מדי' };
  }

  const sheet = getContactSheet();
  sheet.appendRow([new Date(), name, email, message]);

  return { status: 'success', message: 'ההודעה נשלחה בהצלחה' };
}

function getRecipesSheet() {
  return getOrCreateSheet(RECIPES_SHEET_NAME, [
    'id',
    'mainTitle',
    'subTitle',
    'prepTime',
    'servings',
    'ingredientsJson',
    'instructionsJson',
    'username',
    'email',
    'date',
    'likes'
  ]);
}

function addRecipeObj(data) {
  const username = safeString(data.username || data.name);
  const email = safeString(data.email);
  const mainTitle = safeString(data.mainTitle);

  if (!username) return { status: 'error', message: 'שם משתמש חובה' };
  if (!mainTitle) return { status: 'error', message: 'כותרת מתכון חובה' };

  const ingredientsJson = JSON.stringify(parseJsonArray(data.ingredients));
  const instructionsJson = JSON.stringify(parseJsonArray(data.instructions));

  const id = Utilities.getUuid();

  getRecipesSheet().appendRow([
    id,
    mainTitle,
    safeString(data.subTitle),
    safeString(data.prepTime),
    safeString(data.servings),
    ingredientsJson,
    instructionsJson,
    username,
    email,
    new Date().toISOString(),
    0
  ]);

  return { status: 'success', message: 'המתכון נוסף בהצלחה!', id: id };
}

function getRecipesListObj() {
  const sheet = getRecipesSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      if (header === 'ingredientsJson' || header === 'instructionsJson') {
        try {
          obj[header] = JSON.parse(row[i] || '[]');
        } catch (err) {
          obj[header] = [];
        }
      } else {
        obj[header] = row[i];
      }
    });
    return obj;
  }).filter(recipe => recipe.id);
}

function addRecipeLikeObj(data) {
  const id = safeString(data.id);
  if (!id) return { status: 'error', message: 'missing id' };

  const sheet = getRecipesSheet();
  const allData = sheet.getDataRange().getValues();
  const h = buildHeaderIndex(allData[0] || []);
  const idIndex = getIndex(h, ['id', 'ID']);
  const likesIndex = getIndex(h, ['likes', 'Likes']);

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][idIndex]) === id) {
      const currentLikes = parseInt(allData[i][likesIndex] || 0, 10);
      sheet.getRange(i + 1, likesIndex + 1).setValue((isNaN(currentLikes) ? 0 : currentLikes) + 1);
      return { status: 'success' };
    }
  }

  return { status: 'error', message: 'not found' };
}

function safeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function healthStatusObj() {
  let spreadsheetAccessible = false;

  try {
    SpreadsheetApp.openById(SPREADSHEET_ID);
    spreadsheetAccessible = true;
  } catch (err) {
    spreadsheetAccessible = false;
  }

  return {
    status: 'success',
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetAccessible: spreadsheetAccessible,
    now: new Date().toISOString()
  };
}
