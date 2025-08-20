import express from 'express';
import { Todo } from '../../models/Todo.js'; 

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const todos = await Todo.find().sort({ createdAt: -1 });
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching todos' });
    }
});

router.post('/', async (req, res) => {
    try {
        if (!req.body.text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const todo = new Todo({
            text: req.body.text,
            completed: false
        });

        const savedTodo = await todo.save();
        res.json(savedTodo);
    } catch (error) {
        res.status(500).json({ error: 'Error creating todo' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const todo = await Todo.findByIdAndUpdate(
            req.params.id,
            { completed: req.body.completed },
            { new: true }
        );
        res.json(todo);
    } catch (error) {
        res.status(500).json({ error: 'Error updating todo' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Todo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Todo deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting todo' });
    }
});

export default router;
