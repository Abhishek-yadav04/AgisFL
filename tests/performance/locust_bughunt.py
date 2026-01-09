from locust import HttpUser, task, between

class BugHuntUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def sql_injection(self):
        self.client.post('/auth/login', json={"username": "' OR 1=1;--", "password": "irrelevant"})

    @task
    def large_payload(self):
        large_data = {"name": "Big", "data": [0]*1000000}
        self.client.post('/datasets/upload', json=large_data)

    @task
    def invalid_json(self):
        self.client.post('/datasets/upload', data="not a json")
