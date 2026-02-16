/**
 * Google Apps Script for Forum with Recipes Feature
 * This file should be deployed as a Web App in Google Apps Script
 */

// Configuration
const SHEET_NAME = "Forum";
const RECIPES_SHEET_NAME = "Recipes";

/**
 * Handle GET requests - return forum posts or recipes list
 */
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'recipeList') {
    return getRecipesList();
  }
  
  // Default: return forum posts
  return getForumPosts();
}

/**
 * Handle POST requests - add posts, comments, likes, recipes, etc.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    // Handle different actions
    if (action === 'recipe') {
      return addRecipe(data);
    } else if (action === 'recipeList') {
      return getRecipesList();
    } else if (action === 'recipeLike') {
      return addRecipeLike(data);
    } else if (action === 'register') {
      return registerUser(data);
    } else if (action === 'like') {
      return addLike(data);
    } else if (action === 'delete') {
      return deletePost(data);
    } else if (action === 'deleteReply') {
      return deleteReply(data);
    } else {
      // Default: add forum post/comment
      return addForumPost(data);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all forum posts
 */
function getForumPosts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Name', 'Username', 'Email', 'Category', 'Subject', 'Content', 'Timestamp', 'Likes', 'ParentID']);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const posts = rows.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  }).filter(post => post.ID); // Filter out empty rows
  
  return ContentService.createTextOutput(JSON.stringify(posts))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Add a new forum post or comment
 */
function addForumPost(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Name', 'Username', 'Email', 'Category', 'Subject', 'Content', 'Timestamp', 'Likes', 'ParentID']);
  }
  
  const id = Utilities.getUuid();
  const timestamp = new Date().toISOString();
  const parentId = data.parentId || '';
  
  sheet.appendRow([
    id,
    data.name || data.username,
    data.username || data.name,
    data.email || '',
    data.category || '',
    data.subject || '',
    data.content,
    timestamp,
    0,
    parentId
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'הפוסט נוסף בהצלחה'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Register a new user
 */
function registerUser(data) {
  // In a real implementation, you'd want to:
  // 1. Validate the data
  // 2. Hash the password
  // 3. Store in a separate Users sheet
  // 4. Send confirmation email
  
  // For now, just return success
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'נרשמת בהצלחה!'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Add a like to a post
 */
function addLike(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idIndex = headers.indexOf('ID');
  const likesIndex = headers.indexOf('Likes');
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][idIndex] === data.id) {
      const currentLikes = allData[i][likesIndex] || 0;
      sheet.getRange(i + 1, likesIndex + 1).setValue(currentLikes + 1);
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Delete a post
 */
function deletePost(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idIndex = headers.indexOf('ID');
  
  for (let i = allData.length - 1; i >= 1; i--) {
    if (allData[i][idIndex] === data.id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Delete a reply
 */
function deleteReply(data) {
  return deletePost(data);
}

// ==================== RECIPE FUNCTIONS ====================

/**
 * Initialize or get the Recipes sheet
 */
function getRecipesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(RECIPES_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(RECIPES_SHEET_NAME);
    const headers = [
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
    ];
    sheet.appendRow(headers);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4db8d9');
    headerRange.setFontColor('#ffffff');
  }
  
  return sheet;
}

/**
 * Add a new recipe
 */
function addRecipe(data) {
  const sheet = getRecipesSheet();
  const id = Utilities.getUuid();
  const timestamp = new Date().toISOString();
  
  sheet.appendRow([
    id,
    data.mainTitle,
    data.subTitle || '',
    data.prepTime,
    data.servings,
    data.ingredients,
    data.instructions,
    data.username,
    data.email || '',
    timestamp,
    0
  ]);
  
  // Send email notification if email provided
  if (data.email) {
    try {
      sendRecipeConfirmationEmail(data);
    } catch (error) {
      Logger.log('Error sending email: ' + error);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'המתכון נוסף בהצלחה!',
    id: id
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get list of all recipes
 */
function getRecipesList() {
  const sheet = getRecipesSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const recipes = rows.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  }).filter(recipe => recipe.id); // Filter out empty rows
  
  return ContentService.createTextOutput(JSON.stringify(recipes))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Add a like to a recipe
 */
function addRecipeLike(data) {
  const sheet = getRecipesSheet();
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idIndex = headers.indexOf('id');
  const likesIndex = headers.indexOf('likes');
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][idIndex] === data.id) {
      const currentLikes = allData[i][likesIndex] || 0;
      sheet.getRange(i + 1, likesIndex + 1).setValue(currentLikes + 1);
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Send confirmation email when a recipe is added
 */
function sendRecipeConfirmationEmail(data) {
  const subject = 'המתכון שלך נוסף בהצלחה! - ' + data.mainTitle;
  const body = `
שלום ${data.username},

תודה שהוספת את המתכון "${data.mainTitle}" לפורום!

פרטי המתכון:
- שם המתכון: ${data.mainTitle}
- תיאור: ${data.subTitle || 'לא צוין'}
- זמן הכנה: ${data.prepTime}
- כמות מנות: ${data.servings}

המתכון פורסם בהצלחה ויופיע בקרוב באתר.

בברכה,
צוות הפורום
  `;
  
  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: body
  });
}
