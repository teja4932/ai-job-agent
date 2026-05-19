# Smart Role Generation & Search System

We have implemented the **Option C (Hybrid Smart Approach)** to resolve repetitive role generation and allow dynamic, customized searches.

## Features Implemented

### 1. Diversified Role Generation Prompt
- Refactored `backend/services/aiService.js` to prompt the Groq LLM to generate at least **6-8 distinct, non-repetitive, specialized alternative titles** inside the candidate's career field.
- Prevents repetitive titles (like "Software Engineer, Senior Software Engineer") and instead outputs specialized roles (like "Frontend Developer, React Developer, UI Engineer, JavaScript Developer").

### 2. Interactive "Recommended Roles" Chips
- Transformed the static roles list in the frontend into interactive click-to-search chips.
- Selecting any chip highlights it, updates the search query, and dynamically triggers a fresh search on the selected platform.

### 3. Smart Editable Search Box
- Added a search input box inside the opportunities view.
- The input is prepopulated with the first recommended job title.
- Users can edit the search terms to run queries for any role.
- Fully supports pressing the **Enter** key or clicking the search button.
- Restructures frontend state so that clicking different platforms will search the current custom input value rather than resetting to a single static role.
