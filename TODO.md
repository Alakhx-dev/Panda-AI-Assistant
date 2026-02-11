# TODO: Fix Default Landing Page Behavior

## Steps to Complete

- [x] Add necessary imports (session, redirect, url_for, json) to backend/app.py
- [x] Set app.secret_key for session management
- [x] Update @app.route('/') to redirect based on login status
- [x] Add @app.route('/signup', methods=['GET', 'POST']) for signup functionality
- [x] Add @app.route('/login', methods=['GET', 'POST']) for login functionality
- [x] Add @app.route('/summary') with authentication guard
- [x] Test the application flow (signup -> login -> summary, redirects for unauthenticated access)

## Notes
- Use users.json for storing user credentials.
- Ensure no UI changes, only backend logic.
- After completion, run the app with `python backend/app.py` and test in browser.
- App is now running on http://127.0.0.1:5000
