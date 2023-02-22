import database from './database.js';

export const connectDB = (env, params) => {
  database.sequelize
    .sync(params)
    .then(() => {
      console.log(`Database running in ${env} mode`);
    })
    .catch((error) => {
      console.error('An error occured', error);
    });
  // .finally((error) => {
  //   console.warn('Unable to start database', error);
  // });
};

export const closeDB = () => {
  database.sequelize
    .close()
    .then(() => {
      console.log('Database successfully closed!!!');
    })
    .catch((error) => {
      console.error('Error: Unable to stop database', error);
    });
  // .finally((error) => {
  //   console.warn('Error: ', error);
  // });
};
