import 'dotenv/config';
import app from './app'; 
// import database function below here 
// invoke the database function below here 

const port = process.env.PORT;   

app.listen(port, () => { 
    console.log(`Server Successfully Running on: http://localhost:${port}`); 
}); 