import express from 'express'; 
const app = express();  

app.use(express.json());   

//Routes defined below  


app.get('/', (req, res) => { 
    res.redirect('overview'); 
})

app.get('/overview', (req, res) =>  {
    res.json({ 
        Overview: { 
            ProjectDescription: 
                `MongoDB + Express.js project focused on understanding and implementing Express.js middleware functions. 
                Includes seeded data for testing and working with database operations, with Docker integration to reinforce 
                containerization concepts through hands-on development`
        }
    }); 
}); 


// Mount routes below here 


export default app; 
