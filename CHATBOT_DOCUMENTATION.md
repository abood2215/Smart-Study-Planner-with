# AI Chatbot Widget - Documentation

## Overview
The Smart Study Planner now includes an AI-powered chatbot widget that appears in a fixed corner of the screen. Students can ask questions about their courses, tasks, schedules, and study strategies.

## Features

### 💬 Interactive Chat
- Real-time messaging with AI responses
- Typing indicator while waiting for response
- Message history during session
- Responsive design for mobile and desktop

### 🤖 AI Capabilities
The chatbot uses OpenAI's GPT-4 model to provide:
- Study tips and strategies
- Course explanations
- Task management advice
- Time management suggestions
- Motivation and encouragement
- General academic guidance

### 📱 User Interface
- Floating chat button in bottom-right corner (can be moved via CSS)
- Expandable chat window with smooth animations
- Clean, modern design with gradient backgrounds
- Auto-scroll to latest messages
- Easy close functionality

## Files Structure

### Frontend Files
```
frontend/
├── assets/
│   ├── css/
│   │   └── chatbot.css          # Chatbot styling
│   └── js/
│       └── chatbot.js            # Chatbot widget logic
└── [all pages]                  # Integrated into main pages
```

### Backend Files
```
backend/
├── api/
│   └── chatbot.php              # Chatbot API endpoint
└── includes/
    └── OpenAIService.php        # OpenAI integration
```

## Integration

### Pages with Chatbot
The chatbot is integrated into the following pages:
- ✅ Dashboard (`dashboard.html`)
- ✅ Tasks (`tasks.html`)
- ✅ Courses (`courses.html`)
- ✅ Schedule (`schedule.html`)
- ✅ Calendar (`calendar.html`)

### How to Add to New Pages
1. Add CSS link in `<head>`:
```html
<link rel="stylesheet" href="assets/css/chatbot.css">
```

2. Add JS script before `</body>`:
```html
<script src="assets/js/chatbot.js"></script>
```

## Usage

### For Users
1. Click the chat button (💬 icon) in bottom-right corner
2. Type your question or request
3. Press Enter or click the send button
4. Wait for AI response
5. Continue conversation as needed

### For Developers

#### API Endpoint
**Endpoint:** `/Smart-Study-Planner-with/api/chatbot.php`

**Method:** POST

**Authentication:** Required (Bearer token)

**Request:**
```json
{
    "message": "How should I study for my Python exam?"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Response generated",
    "data": {
        "response": "Here are some tips for studying Python...",
        "source": "openai"
    }
}
```

#### Using the Chatbot in JavaScript
```javascript
// Access the global chatbot instance
const chatbot = window.chatWidget;

// Open chat
chatbot.openChat();

// Close chat
chatbot.closeChat();

// Send a message programmatically
const input = document.getElementById('chatInput');
input.value = "Your message here";
chatbot.sendMessage();

// Clear chat history
chatbot.clearChatHistory();
```

## Configuration

### OpenAI API Setup
1. API key is stored in `.env` file:
```
OPENAI_API_KEY="sk-proj-xxxxx..."
```

2. Configuration in `backend/includes/config.php`:
```php
define('OPENAI_API_KEY', getenv('OPENAI_API_KEY'));
define('OPENAI_API_URL', getenv('OPENAI_API_URL'));
```

### Customization

#### Change Chat Button Position
Edit `frontend/assets/css/chatbot.css`:
```css
.chat-widget {
    bottom: 20px;  /* Distance from bottom */
    right: 20px;   /* Distance from right */
}
```

#### Change Colors
```css
.chat-button {
    background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}

.message.user .message-content {
    background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}
```

#### Adjust Chatbot Window Size
```css
.chat-window {
    width: 380px;   /* Chatbot width */
    height: 600px;  /* Chatbot height */
}
```

## Error Handling

### When AI API Fails
The chatbot provides fallback responses based on keywords:
- "Hello" → Greeting response
- "How to" → Study guidance
- "Motivation" → Encouragement
- "Task/Assignment" → Task advice
- "Schedule/Time" → Time management tips
- "Python" → Python-specific tips
- "JavaScript" → JavaScript-specific tips
- "Database/SQL" → Database-specific tips

### Fallback Message
If the API is unavailable:
```
"That's an interesting question! While I work best with study-related topics, 
I'm here to help. Can you give me more context about what you're studying 
or trying to accomplish?"
```

## Performance Tips

1. **Lazy Load Chatbot**: Load chatbot.js after main content loads
2. **Compress Messages**: Older messages can be archived
3. **Rate Limiting**: Implement on backend if needed

## Security

- ✅ JWT Authentication required
- ✅ HTML escape for user messages
- ✅ API key stored in environment variables
- ✅ CORS headers configured
- ✅ Input validation on backend

## Troubleshooting

### Chatbot Not Showing
1. Check if chatbot.css is loaded in browser DevTools
2. Verify chatbot.js is linked on the page
3. Check browser console for errors

### API Errors
1. Verify OpenAI API key in `.env` file
2. Check user is authenticated (token in localStorage)
3. Review API endpoint URL in chatbot.js
4. Check browser Network tab for failed requests

### Messages Not Sending
1. Ensure user is logged in
2. Check browser console for JavaScript errors
3. Verify internet connection
4. Check API response in Network tab

## Future Enhancements

- [ ] Persistent chat history to database
- [ ] Chat export functionality
- [ ] User feedback on responses
- [ ] Context-aware responses based on user's current course
- [ ] Voice input/output
- [ ] Multiple language support
- [ ] Chat analytics and insights
- [ ] Integration with calendar for schedule suggestions

## Support
For issues or feature requests, contact the development team.
