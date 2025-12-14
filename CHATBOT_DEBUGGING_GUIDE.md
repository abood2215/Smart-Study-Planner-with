# Chatbot Debugging Guide

## 🚀 Quick Start

### 1. Verify Chatbot is Visible
1. Open [http://localhost/Smart-Study-Planner-with/dashboard.html](http://localhost/Smart-Study-Planner-with/dashboard.html)
2. Press **F12** to open DevTools
3. Look at **bottom-right corner** of the page - you should see a **large purple 💬 button** (70px circle)
4. Check **Console tab** - you should see: `✅ ChatBot Widget initialized successfully`

### 2. Test Chatbot Functionality

**Option A: Using the chatbot directly**
1. Click the 💬 button to open the chat window
2. Log in with test credentials if needed:
   - Email: `ahmad@test.com` or `john@test.com`
   - Password: `password123`
3. In the chat window, type a message like "Hello" or "How should I study?"
4. Click "Send" or press Enter

**Option B: Using the Test Page (Recommended)**
1. Open [http://localhost/Smart-Study-Planner-with/chatbot-test.html](http://localhost/Smart-Study-Planner-with/chatbot-test.html)
2. Your token should auto-fill if you're logged in
3. Type a test message
4. Click "Send Message"
5. Check the response

---

## 🔍 Debugging Steps

### Issue: Chatbot Button Not Visible

**Step 1: Check Console for Errors**
- Open DevTools (F12) → Console tab
- Look for red error messages
- Expected message: `✅ ChatBot Widget initialized successfully`

**Step 2: Check if CSS is Loading**
- Open DevTools → Network tab
- Refresh the page
- Look for `chatbot.css` - should have status **200**
- If status is 404, the CSS file isn't being found

**Step 3: Check if JavaScript is Loading**
- In Network tab, look for `chatbot.js` - should have status **200**
- If status is 404, the JS file isn't being found

**Step 4: Check HTML Structure**
- Open DevTools → Elements tab
- Press Ctrl+F and search for `.chat-widget`
- You should find a `<div class="chat-widget">` element
- If not found, the JavaScript didn't run

**Step 5: Verify CSS is Applied**
- In Elements tab, find the `.chat-button` element
- Check the Styles panel - you should see CSS rules
- Look for: `display`, `width: 70px`, `height: 70px`, `position: fixed`

---

### Issue: 401 Unauthorized Error When Sending Message

**Step 1: Check Authentication Token**
```javascript
// In DevTools Console, run:
localStorage.getItem('token')
```
- If it returns `null`, you're not logged in
- If it returns a token string, copy it and check next step

**Step 2: Check Token Format**
```javascript
// In DevTools Console, run:
const token = localStorage.getItem('token');
console.log('Token format:', token.substring(0, 50) + '...');
console.log('Token includes dots:', token.includes('.'));
```
- Token should have 2 dots, separating 3 parts: `header.payload.signature`
- If it doesn't, the token is corrupted

**Step 3: Monitor Network Request**
1. Open DevTools → Network tab
2. Make sure it's recording (red circle should be visible)
3. Click chat button and send a message
4. Find `chatbot.php` in the Network tab
5. Click on it and check:
   - **Status**: Should be 200 (success) or 401 (auth error)
   - **Headers** tab → look for `Authorization: Bearer ...`
   - **Response** tab → shows the server's response

**Step 4: Check Server Logs**
1. Open `backend/logs/app.log`
2. Look for recent entries with "Chatbot API"
3. Check if authentication headers are being received

---

### Issue: API Returns 401 Even When Logged In

**Possible Causes:**

1. **Token Expired**
   - Token expires after 24 hours
   - Solution: Log out and log back in
   - Code in JavaScript: `localStorage.removeItem('token'); location.reload();`

2. **Wrong Authorization Header Format**
   - Should be: `Authorization: Bearer YOUR_TOKEN_HERE`
   - Check Network tab → chatbot.php request → Headers section
   - Look for `authorization` header

3. **API Endpoint Not Accepting Bearer Token**
   - Check `backend/includes/functions.php` - verify `getAuthToken()` function
   - Should look for `Authorization` header and extract Bearer token

4. **CORS Headers Missing**
   - Recent update added CORS headers to chatbot.php
   - These allow cross-origin requests

---

## 📋 Files to Check

### Frontend Files
- ✅ `frontend/assets/css/chatbot.css` - Styling (70px button, 420x650 window)
- ✅ `frontend/assets/js/chatbot.js` - Widget functionality
- ✅ `dashboard.html` - Includes chatbot CSS/JS
- ✅ `tasks.html` - Includes chatbot CSS/JS
- ✅ `courses.html` - Includes chatbot CSS/JS
- ✅ `schedule.html` - Includes chatbot CSS/JS
- ✅ `calendar.html` - Includes chatbot CSS/JS

### Backend Files
- ✅ `backend/api/chatbot.php` - API endpoint with authentication
- ✅ `backend/includes/OpenAIService.php` - OpenAI integration
- ✅ `backend/includes/functions.php` - Auth and utility functions
- ✅ `backend/includes/config.php` - Configuration (API keys)

### Configuration Files
- ✅ `.htaccess` - URL rewriting rules
- ✅ `.env` - Environment variables (OPENAI_API_KEY)
- ✅ `logs/app.log` - Server logs

---

## 🧪 Test Checklist

### Before Testing
- [ ] Are you logged in? (check `localStorage.getItem('token')`)
- [ ] Is the page fully loaded? (check Network tab)
- [ ] No JavaScript errors in Console?

### Widget Display Test
- [ ] Can you see the 💬 button?
- [ ] Button is in the bottom-right corner?
- [ ] Button is purple/gradient color?
- [ ] Console shows initialization message?

### Functionality Test
- [ ] Click button opens chat window?
- [ ] Chat window slides up smoothly?
- [ ] Can you type in the input field?
- [ ] Send button responds to clicks?

### API Test
- [ ] Network tab shows `chatbot.php` request?
- [ ] Status is 200 (not 401)?
- [ ] Response contains valid JSON?
- [ ] Chat displays AI response or fallback?

### Mobile Test
- [ ] Button still visible on mobile (width < 768px)?
- [ ] Chat window fits on mobile screen?
- [ ] Input field is usable on mobile?

---

## 🔧 Quick Fixes

### Fix: Clear Browser Cache
```bash
# Option 1: In DevTools
Right-click on Network tab refresh icon → "Empty cache and hard refresh"

# Option 2: Local Storage
# In DevTools Console:
localStorage.clear();
location.reload();
```

### Fix: Re-login
```javascript
// In DevTools Console:
localStorage.removeItem('token');
// Then refresh page and log in again
```

### Fix: Test Server Status
```bash
# Check if PHP is running:
# Visit http://localhost/Smart-Study-Planner-with/
# Should see project files listed or error message

# Check if API works:
# Visit http://localhost/Smart-Study-Planner-with/api/chatbot.php
# Should see authentication error (that's expected without token)
```

---

## 📊 Expected Behavior

### Successful Login
- Token saved in `localStorage` with key `token`
- Dashboard loads with user's data visible
- Chatbot button visible in corner

### Successful API Call
```json
{
  "success": true,
  "message": "Response generated",
  "data": {
    "response": "Your AI response here...",
    "source": "openai"  // or "fallback"
  }
}
```

### Failed API Call (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## 💡 Pro Tips

1. **Use Test Page**: Open `chatbot-test.html` for simpler testing without full app
2. **Check Logs**: Server logs in `backend/logs/app.log` show what's happening
3. **Console Logging**: JavaScript has detailed `console.log()` statements - check Console tab
4. **Network Tab**: Shows exact request/response - essential for debugging API issues
5. **Token Lifetime**: Tokens expire after 24 hours - re-login if old token fails

---

## 🆘 Still Having Issues?

**Collect this information:**
1. Screenshot of the error message
2. Full error from DevTools Console (right-click → Copy)
3. Network tab response (chatbot.php request)
4. Last lines from `backend/logs/app.log`
5. What action triggered the error?

**Then:**
1. Clear cache and hard refresh (Ctrl+Shift+R)
2. Log out completely (`localStorage.clear()`)
3. Log back in fresh
4. Try again from a new browser tab

---

## 📚 Relevant API Documentation

- **Endpoint**: `/Smart-Study-Planner-with/api/chatbot.php`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_JWT_TOKEN`
- **Body**: `{ "message": "Your question here" }`
- **Response**: JSON with `success`, `message`, and `data` fields

---

## 🎯 Next Steps

1. **Verify Button is Visible** → Check DevTools
2. **Test with Test Page** → Use `chatbot-test.html`
3. **Check Network Requests** → Monitor API calls
4. **Review Server Logs** → See what backend is doing
5. **Test Different Messages** → Try "Hello", "Python tips", etc.

All files have been updated with improved authentication handling, CORS support, and detailed logging to help diagnose issues!
