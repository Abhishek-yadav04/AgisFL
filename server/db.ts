const connectionConfig = {
  host: process.env.DATABASE_HOST || "0.0.0.0",
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  username: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "admin",
  database: process.env.DATABASE_NAME || "mydatabase",
  ssl: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
};

function checkPostgreSQL() {
  return new Promise((resolve) => {
    console.log("🔍 Testing PostgreSQL connection...");

    const child = spawn(
      "psql",
      [
        "-h",
        connectionConfig.host,
        "-p",
        connectionConfig.port.toString(),
        "-U",
        connectionConfig.username,
        "-d",
        connectionConfig.database,
        "-c",
        "SELECT 1 as test;",
      ],
      {
        stdio: "pipe",
        shell: true,
        env: { ...process.env, PGPASSWORD: connectionConfig.password },
      },
    );

    child.on("close", (code) => {
      if (code === 0) {
        console.log("✅ PostgreSQL connection successful");
        resolve(true);
      } else {
        console.log("⚠️ PostgreSQL connection failed - using mock data mode");
        resolve(false);
      }
    });

    child.on("error", () => {
      console.log("⚠️ PostgreSQL not available - using mock data mode");
      resolve(false);
    });
  });
}
