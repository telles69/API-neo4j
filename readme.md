# API Rede Social (Neo4j + Node.js)

API RESTful para uma rede social simples utilizando Neo4j como banco de dados de grafo.

## Instalação

```bash
npm install
```

## Configuração (.env)

```properties
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=sua_senha
API_PORT=3000
```

## Executar

```bash
npm run dev
```

## 🛠️ Configuração do Neo4j (Acesso Externo)

Para permitir conexões externas (necessário se o banco não estiver na mesma máquina ou container), altere a configuração para ouvir em `0.0.0.0`.

### 1. Abra o Arquivo de Configuração
```bash
sudo nano /etc/neo4j/neo4j.conf
```

### 2. Procure e Altere as Linhas

**🔌 Conector HTTP (Para o Neo4j Browser)**
Procure pela linha `#server.http.listen_address=:7474` e altere para:
```properties
server.http.listen_address=0.0.0.0:7474
```

**⚡ Conector Bolt (Protocolo de Driver)**
Procure pela linha `#server.bolt.listen_address=:7687` e altere para:
```properties
server.bolt.listen_address=0.0.0.0:7687
```

### 3. Salve e Reinicie
Salve o arquivo e reinicie o serviço:
```bash
sudo systemctl restart neo4j
```




## Endpoints

### Usuários (User)
- `POST /users` - Criar usuário
  - Body: `{ "username": "ana", "email": "ana@email.com", "password": "123", "bio": "Olá" }`
- `GET /users/:id` - Ver perfil
- `POST /users/:id/follow` - Seguir usuário
  - Body: `{ "followerId": "uuid-do-usuario-que-segue" }`
- `GET /recommendations/friends/:id` - Recomendação de amigos (amigos de amigos)

### Posts
- `POST /posts` - Criar post
  - Body: `{ "content": "Meu primeiro post!", "userId": "uuid-do-autor" }`
- `GET /posts/:id` - Ver post
- `POST /posts/:id/like` - Curtir post
  - Body: `{ "userId": "uuid-do-usuario" }`
- `GET /feed?userId=uuid-do-usuario` - Feed de notícias (posts de quem você segue)
- `POST /posts/:id/comments` - Comentar em post
  - Body: `{ "text": "Legal!", "userId": "uuid-do-autor" }`

## Modelo de Dados (Grafo)

- **Nós**: `User`, `Post`, `Comment`
- **Relacionamentos**:
  - `(:User)-[:POSTED]->(:Post)`
  - `(:User)-[:FOLLOWS]->(:User)`
  - `(:User)-[:LIKES]->(:Post)`
  - `(:User)-[:WROTE]->(:Comment)-[:ON]->(:Post)`

## Scripts Cypher (Índices)

Os índices são criados automaticamente ao iniciar a aplicação, mas aqui estão eles para referência:

```cypher
CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT user_username IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE;
CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE;
CREATE CONSTRAINT post_id IF NOT EXISTS FOR (p:Post) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT comment_id IF NOT EXISTS FOR (c:Comment) REQUIRE c.id IS UNIQUE;
```



