# INSTRUÇÕES DE USO

## RODE
```js
npm install
```

## Coloque no .env
```js
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4jteste
API_PORT=3333
```

## Rode
```js
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


