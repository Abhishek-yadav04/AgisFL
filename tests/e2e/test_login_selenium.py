import socket
import unittest

# Skip the entire module if selenium or the frontend server are not available.
try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
except Exception:
    raise unittest.SkipTest("selenium not available in this environment")


def _frontend_is_up(host: str = '127.0.0.1', port: int = 3000, timeout: float = 0.5) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False


if not _frontend_is_up():
    raise unittest.SkipTest('frontend server not running at http://localhost:3000; skipping e2e selenium tests')


class LoginTest(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.driver.get('http://localhost:3000/login')

    def test_login_success(self):
        driver = self.driver
        driver.find_element(By.NAME, 'username').send_keys('user1')
        driver.find_element(By.NAME, 'password').send_keys('StrongPass123!')
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        self.assertIn('dashboard', driver.current_url)

    def test_login_failure(self):
        driver = self.driver
        driver.find_element(By.NAME, 'username').send_keys('user1')
        driver.find_element(By.NAME, 'password').send_keys('wrongpass')
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        self.assertIn('login', driver.current_url)

    def tearDown(self):
        self.driver.quit()

if __name__ == '__main__':
    unittest.main()
