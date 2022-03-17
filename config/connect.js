import database from "./database.js";
export async function connectDB(env, params) {
  await database.sequelize.sync(params);
  console.log(`Database running in ${env} mode`);
}

export async function closeDB() {
  await database.sequelize.close();
}
