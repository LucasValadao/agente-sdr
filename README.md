# Desafio-elite-dev-IA
Desenvolvimento de um agente SDR automatizado usando OpenAPI.

## 1 - Clonar o projeto
```bash 
git clone https://github.com/seu-usuario/desafio-elite-dev-ia.git
cd Desafio-elite-dev-IA 
```

## 2 - Instalar as dependências
 2.1 - 
 ```bash 
 cd backend
 npm install 
 ```
### 2.2 - 
```bash 
cd ../frontend/desafio-elite-dev-ia
npm install
```

## 3 - Configure o .env.example.
Troque a key do gemini, os tokens do pipefy e calendly, e insira o ID do pipe que será utilizado e o ID do usuario do calendly.

## 4 - Execute os serviços
```bash 
cd backend
npm run dev
```
Em outro terminal execute:
```bash 
cd frontend/desafio-elite-dev-ia
npm run dev
```

Acesse http://localhost:5173.

## Fluxo de conversa:
Inicialmente o cliente inicia o chat e informa nome e empresa, o agente coleta email e interesse.
Ao confirmar interesse, o assistente sugere horários e realiza o agendamento via Calendly registrando o lead (com status) no Pipefy.

## Requisitos Técnicos
Node.js v18+, 
NPM v9+, 
Navegador compatível com ES2022

## Exemplo de prompt do fluxo completo funcional