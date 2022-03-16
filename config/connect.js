import database from "./database.js";
export async function connectDB() {
  // running in production
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "development"
  ) {
    await database.sequelize.sync().then(() => {
      console.log("Database running");
    });
  } else {
    await database.sequelize.sync().then(() => {
      console.log("Test Database running....");
    });
  }
}

export async function closeDB() {
  await database.sequelize.close();
}
