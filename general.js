const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let users = require("./auth_users.js").users;

const public_users = express.Router();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

// ---------------------------------------------------------------
// Internal endpoint: returns the raw books data as JSON.
// The public routes below fetch from it using Axios (async/await).
// ---------------------------------------------------------------
public_users.get('/internal/books', (req, res) => {
    return res.status(200).json(books);
});

// Helper: fetch all books through Axios and add the ISBN to each entry
async function fetchBooks() {
    const response = await axios.get(`${BASE_URL}/internal/books`);
    return response.data;
}

// ---------------------------------------------------------------
// Register a new user
// ---------------------------------------------------------------
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const exists = users.some((user) => user.username === username);
    if (exists) {
        return res.status(409).json({ message: "User already exists" });
    }

    users.push({ username, password });
    return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// ---------------------------------------------------------------
// Get the list of all books (Axios + async/await)
// ---------------------------------------------------------------
public_users.get('/', async (req, res) => {
    try {
        const allBooks = await fetchBooks();
        return res.status(200).send(JSON.stringify(allBooks, null, 4));
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving books", error: error.message });
    }
});

// ---------------------------------------------------------------
// Get book details by ISBN (Axios + async/await)
// ---------------------------------------------------------------
public_users.get('/isbn/:isbn', async (req, res) => {
    try {
        const isbn = req.params.isbn;
        const allBooks = await fetchBooks();

        if (allBooks[isbn]) {
            return res.status(200).send(JSON.stringify(allBooks[isbn], null, 4));
        }
        return res.status(404).json({ message: "Book not found for ISBN " + isbn });
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving book by ISBN", error: error.message });
    }
});

// ---------------------------------------------------------------
// Get book details by author (Axios + async/await)
// ---------------------------------------------------------------
public_users.get('/author/:author', async (req, res) => {
    try {
        const author = req.params.author.toLowerCase();
        const allBooks = await fetchBooks();

        const result = Object.keys(allBooks)
            .filter((isbn) => allBooks[isbn].author.toLowerCase() === author)
            .map((isbn) => ({ isbn, ...allBooks[isbn] }));

        if (result.length > 0) {
            return res.status(200).send(JSON.stringify({ booksbyauthor: result }, null, 4));
        }
        return res.status(404).json({ message: "No books found for author " + req.params.author });
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving books by author", error: error.message });
    }
});

// ---------------------------------------------------------------
// Get book details by title (Axios + async/await)
// ---------------------------------------------------------------
public_users.get('/title/:title', async (req, res) => {
    try {
        const title = req.params.title.toLowerCase();
        const allBooks = await fetchBooks();

        const result = Object.keys(allBooks)
            .filter((isbn) => allBooks[isbn].title.toLowerCase() === title)
            .map((isbn) => ({ isbn, ...allBooks[isbn] }));

        if (result.length > 0) {
            return res.status(200).send(JSON.stringify({ booksbytitle: result }, null, 4));
        }
        return res.status(404).json({ message: "No books found with title " + req.params.title });
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving books by title", error: error.message });
    }
});

// ---------------------------------------------------------------
// Get book reviews
// ---------------------------------------------------------------
public_users.get('/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;

    if (books[isbn]) {
        return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
    }
    return res.status(404).json({ message: "Book not found for ISBN " + isbn });
});

module.exports.general = public_users;
