const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

app.use(bodyParser.json());

app.use('/socket.io', express.static(path.join(__dirname, '/node_modules/socket.io/client-dist')));

app.post('/collect-data', (req, res) => {
  const { email, cpf } = req.body;

  if (!email || !cpf) {
    return res.status(400).json({ message: 'Email e CPF são obrigatórios' });
  }

  const token = jwt.sign({ email, cpf }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

const verifyJWT = (socket, next) => {
  const token = socket.handshake.query.token;

  if (!token) {
    return next(new Error('Token não fornecido'));
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return next(new Error('Autenticação falhou'));
    }
    socket.decoded = decoded;
    next();
  });
};

io.use(verifyJWT);

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.decoded.email);

  socket.emit('confirmation', 'Autenticação bem-sucedida!');

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.decoded.email);
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
