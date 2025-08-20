import chai from 'chai';
import chaiHttp from 'chai-http';
import { before, describe, it, beforeEach, after } from 'mocha';
import mongoose from 'mongoose';
import { app, Todo } from '../index.js';



// Configure chai
const expect = chai.expect;
chai.should();
chai.use(chaiHttp);

describe('Todo API Tests', () => {
    before(async () => {
        // Ensure database is connected before running tests
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect('mongodb://localhost:27017/todoapp_test');
        }
    });

    beforeEach(async () => {
        // Clear the database before each test
        if (mongoose.connection.collections.todos) {
            await mongoose.connection.collections.todos.deleteMany({});
        }
    });

    after(async () => {
        // Clean up after all tests
        await mongoose.connection.close();
    });

    describe('GET /api/v2/todos', () => {
        it('should get all todos', async () => {
            // Create a test todo first
            const testTodo = new Todo({ text: 'Test todo', completed: false });
            await testTodo.save();

            const res = await chai.request(app)
                .get('/api/v2/todos');

            res.should.have.status(201);
            res.body.should.be.an('array');
            res.body.should.have.lengthOf(1);
            res.body[0].should.have.property('text').eql('Test todo');
        });
    });

    describe('POST /api/v2/todos', () => {
        it('should create a new todo', async () => {
            const res = await chai.request(app)
                .post('/api/v2/todos')
                .send({ text: 'New todo' });

            res.should.have.status(200);
            res.body.should.be.an('object');
            res.body.should.have.property('text').eql('New todo');
            res.body.should.have.property('completed').eql(false);
        });

        it('should not create a todo without text', async () => {
            const res = await chai.request(app)
                .post('/api/v2/todos')
                .send({});

            res.should.have.status(400);
            res.body.should.have.property('error').eql('Text is required');
        });
    });

    describe('PUT /api/v2/todos/:id', () => {
        it('should update a todo', async () => {
            // Create a test todo first
            const testTodo = new Todo({ text: 'Test todo', completed: false });
            const savedTodo = await testTodo.save();

            const res = await chai.request(app)
                .put(`/api/v2/todos/${savedTodo._id}`)
                .send({ completed: true });

            res.should.have.status(200);
            res.body.should.be.an('object');
            res.body.should.have.property('completed').eql(true);
        });

        it('should return 500 for invalid todo id', async () => {
            const res = await chai.request(app)
                .put('/api/v2/todos/invalidid')
                .send({ completed: true });

            res.should.have.status(500);
        });
    });

    describe('DELETE /api/v2/todos/:id', () => {
        it('should delete a todo', async () => {
            // Create a test todo first
            const testTodo = new Todo({ text: 'Test todo', completed: false });
            const savedTodo = await testTodo.save();

            const res = await chai.request(app)
                .delete(`/api/v2/todos/${savedTodo._id}`);

            res.should.have.status(200);
            res.body.should.have.property('message').eql('Todo deleted');

            // Verify the todo was actually deleted
            const deletedTodo = await Todo.findById(savedTodo._id);
            expect(deletedTodo).to.be.null;
        });

        it('should return 500 for invalid todo id', async () => {
            const res = await chai.request(app)
                .delete('/api/v2/todos/invalidid');

            res.should.have.status(500);
        });
    });
});