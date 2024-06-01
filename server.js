const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key';

// Middleware para processar dados JSON
app.use(bodyParser.json());

// Rota para coleta de dados pessoais e geração de JWT
app.post('/collect-data', (req, res) => {
  const { email, cpf } = req.body;

  if (!email || !cpf) {
    return res.status(400).send('Email e CPF são obrigatórios');
  }

  // Gera um JWT
  const token = jwt.sign({ email, cpf }, SECRET_KEY, { expiresIn: '1h' });

  // Retorna o token para o cliente
  res.json({ token });
});

// Middleware para verificação de JWT
const verifyJWT = (socket, next) => {
  const token = socket.handshake.query.token;

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return next(new Error('Autenticação falhou'));
    }
    socket.decoded = decoded;
    next();
  });
};

// Configura o Socket.IO com verificação de JWT
io.use(verifyJWT);

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.decoded.email);

  // Envia uma mensagem de confirmação
  socket.emit('confirmation', 'Autenticação bem-sucedida!');

  // Desconecta o usuário após a confirmação
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.decoded.email);
  });
});

// Rota para servir a página inicial
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
