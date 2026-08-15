import "dotenv/config";
import app from "./app.js";
// import database function below here 
import dbConnection from './config/db.connection.js'; 
// invoke the database function below here
dbConnection(); 

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server Successfully Running on: http://localhost:${port}`);
});
