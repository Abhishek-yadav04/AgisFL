# Advanced Test Suite Coverage

This suite now includes:

- **Unit Tests**: Every utility, helper, and internal logic branch (white-box)
- **Integration Tests**: All API endpoints, error branches, and database interactions
- **Frontend Component Tests**: All UI components, props, and states
- **End-to-End (E2E) Tests**: User journeys, edge cases, and browser automation (Playwright, Selenium)
- **Performance Tests**: Load, stress, and concurrency (Locust)
- **Security Tests**: XSS, SQL injection, auth bypass, and more
- **Black-Box Tests**: External behavior validation without internal knowledge
- **White-Box Tests**: Direct internal logic and branch coverage

## Additional Tooling
- **Selenium**: For browser-based automation and UI validation
- **Playwright**: For modern E2E and security testing
- **Pytest**: For backend unit/integration
- **Locust**: For performance

## How to Run
- See `README.md` for basic usage
- For Selenium tests:
  ```powershell
  python tests/e2e/test_login_selenium.py
  ```
- For black-box/white-box:
  ```powershell
  pytest tests/backend/unit/test_black_box.py
  pytest tests/backend/unit/test_white_box.py
  ```

## Coverage
This suite is designed to leave no feature, function, or edge case untested. All major and minor modules are covered with both adversarial and correctness-focused tests.
