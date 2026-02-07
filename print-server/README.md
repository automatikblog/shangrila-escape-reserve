# Servidor de Impressão - Clube de Lazer Shangri-Lá

Este servidor monitora novos pedidos e envia para a impressora térmica Elgin i9.

## Requisitos

- Node.js 18+ instalado
- Impressora Elgin i9 conectada na mesma rede
- IP da impressora configurado

## Como descobrir o IP da impressora

1. **Pelo roteador/modem**: Acesse a configuração do roteador (geralmente 192.168.1.1) e veja os dispositivos conectados
2. **Pela impressora**: Desligue a impressora, segure o botão FEED e ligue novamente - ela vai imprimir uma página com as configurações incluindo o IP

## Instalação

```bash
cd print-server
npm install
```

## Configuração

Edite o arquivo `.env` com o IP da sua impressora:

```
PRINTER_IP=192.168.15.31
PRINTER_PORT=9100
```

## Executar

```bash
npm start
```

O servidor vai:
1. Conectar ao banco de dados
2. Monitorar novos jobs de impressão em tempo real
3. Enviar comandos ESC/POS para a impressora
4. Marcar jobs como concluídos

## Rodar como serviço (Windows)

Para manter rodando mesmo após reiniciar o computador, instale como serviço:

```bash
npm install -g pm2
pm2 start index.js --name "print-server"
pm2 save
pm2 startup
```
