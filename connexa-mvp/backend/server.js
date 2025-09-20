const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();
app.use(cors());

const db = new sqlite3.Database('../database/connexa.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      curso TEXT NOT NULL,
      periodo TEXT NOT NULL,
      senha TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar tabela usuarios:', err);
      } else {
        console.log('Tabela usuarios pronta.');
      }
    });
  }
});
    // Criação da tabela de grupos (se não existir)
    db.run(`CREATE TABLE IF NOT EXISTS grupos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      materia TEXT NOT NULL,
      descricao TEXT NOT NULL,
      limite INTEGER NOT NULL,
      criador_id INTEGER,
      FOREIGN KEY (criador_id) REFERENCES usuarios(id)
    )`);

    // Middleware body-parser deve vir antes de todos os endpoints
    app.use(bodyParser.json());

    // Endpoint para criar grupo de estudo
    app.post('/api/grupos/criar', (req, res) => {
      console.log('req.body recebido:', req.body);
      const { nome, materia, descricao, limite } = req.body;
      if (!nome || !materia || !descricao || !limite) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
      }
      if (typeof limite !== 'number' || limite < 2 || limite > 20) {
        return res.status(400).json({ erro: 'O limite de participantes deve ser entre 2 e 20.' });
      }
      // Verifica se já existe grupo com o mesmo nome
      db.get('SELECT * FROM grupos WHERE nome = ?', [nome], (err, grupo) => {
        if (err) {
          console.error('Erro ao consultar grupo:', err);
          return res.status(500).json({ erro: 'Erro interno ao consultar grupo.' });
        }
        if (grupo) {
          return res.status(400).json({ erro: 'Já existe um grupo com esse nome.' });
        }
        // Para este exemplo, não temos autenticação, então criador_id será null
        db.run('INSERT INTO grupos (nome, materia, descricao, limite, criador_id) VALUES (?, ?, ?, ?, ?)',
          [nome, materia, descricao, limite, null], function(err) {
            if (err) {
              console.error('Erro ao criar grupo:', err);
              return res.status(500).json({ erro: 'Erro ao criar grupo.' });
            }
            // Aqui, normalmente, adicionaríamos o criador como admin em uma tabela de membros
            return res.status(201).json({ mensagem: 'Grupo criado com sucesso!' });
          });
      });
    });

// Endpoint para listar grupos de estudo
app.get('/api/grupos/listar', (req, res) => {
  db.all('SELECT id, nome, materia, descricao, limite FROM grupos', [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar grupos:', err);
      return res.status(500).json({ erro: 'Erro ao listar grupos.' });
    }
    return res.status(200).json({ grupos: rows });
  });
});

app.use(bodyParser.json());

// Função para validar e-mail institucional (exemplo: @universidade.edu)
function emailInstitucionalValido(email) {
// ...existing code...

// Endpoint de login de usuário
app.post('/api/usuarios/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }
  if (!emailInstitucionalValido(email)) {
    return res.status(400).json({ erro: 'O e-mail informado não é um e-mail institucional válido.' });
  }
  if (!senhaForte(senha)) {
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 8 caracteres, incluindo uma maiúscula, uma minúscula e um número.' });
  }
  db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, usuario) => {
    if (err) {
      console.error('Erro ao consultar usuário no login:', err);
      return res.status(500).json({ erro: 'Erro interno ao consultar usuário.' });
    }
    if (!usuario) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }
    if (usuario.senha !== senha) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }
    // Login bem-sucedido
    return res.status(200).json({ mensagem: 'Login realizado com sucesso!' });
  });
});
  return /@universidade\.edu$/.test(email);
}

// Função para validar senha forte
function senhaForte(senha) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(senha);
}

// Endpoint de cadastro de usuário
app.post('/api/usuarios/cadastro', (req, res) => {
  const { nome, email, curso, periodo, senha } = req.body;

  if (!nome || !email || !curso || !periodo || !senha) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }
  if (!emailInstitucionalValido(email)) {
    return res.status(400).json({ erro: 'O e-mail informado não é um e-mail institucional válido.' });
  }
  if (!senhaForte(senha)) {
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 8 caracteres, incluindo uma maiúscula, uma minúscula e um número.' });
  }
    db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, row) => {
      if (err) {
        console.error('Erro ao consultar e-mail:', err);
        return res.status(500).json({ erro: 'Erro interno ao consultar e-mail.' });
      }
      if (row) {
        return res.status(400).json({ erro: 'O e-mail já está cadastrado.' });
      }
      db.run('INSERT INTO usuarios (nome, email, curso, periodo, senha) VALUES (?, ?, ?, ?, ?)', [nome, email, curso, periodo, senha], function(err) {
        if (err) {
          console.error('Erro ao inserir usuário:', err);
          return res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
        }
        // Simulação de envio de e-mail
        // Aqui você pode configurar o nodemailer para enviar de verdade
        console.log(`E-mail de confirmação enviado para ${email}`);
        return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso! Verifique seu e-mail para confirmação.' });
      });
    });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
