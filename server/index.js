import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import todoRoutesV2 from './routes/v2/todos.js';
import { Todo } from './models/Todo.js';


export const app = express();

app.use(cors());
app.use(express.json());

const isTestEnv = process.env.NODE_ENV === 'test';
const uri = process.env.MONGODB_URI || (isTestEnv ? 'mongodb://localhost:27017/todoapp_test' : 'mongodb://localhost:27017/todoapp');

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.on('error', (err) => {
    console.error('Database connection error:', err);
});

mongoose.connection.once('open', async () => {
    console.log('Database connected successfully.');
});


app.use('/api/v2/todos', todoRoutesV2);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
  
if (process.env.NODE_ENV !== 'test') {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export { Todo };