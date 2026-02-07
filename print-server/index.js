import { createClient } from '@supabase/supabase-js';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Always load .env from this folder (important when running via pm2/service)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '.env'), override: true });

const PRINTER_IP = process.env.PRINTER_IP;
const PRINTER_PORT = Number.parseInt(process.env.PRINTER_PORT ?? '9100', 10);
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gehmvvvlinstfprgtkeg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlaG12dnZsaW5zdGZwcmd0a2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTczNDAsImV4cCI6MjA4MDUzMzM0MH0.TP0Rp0kIzDpwpMcdanPbpex9Xb1I2DcIjehuYsf_YCk';

if (!PRINTER_IP) {
  throw new Error('[CONFIG] PRINTER_IP ausente. Configure no print-server/.env (ex: PRINTER_IP=192.168.15.31)');
}
if (!Number.isFinite(PRINTER_PORT) || PRINTER_PORT <= 0) {
  throw new Error('[CONFIG] PRINTER_PORT inválida. Configure no print-server/.env (ex: PRINTER_PORT=9100)');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const COMMANDS = {
  INIT: ESC + '@',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_LEFT: ESC + 'a' + '\x00',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  DOUBLE_HEIGHT: GS + '!' + '\x10',
  DOUBLE_WIDTH: GS + '!' + '\x20',
  DOUBLE_SIZE: GS + '!' + '\x30',
  NORMAL_SIZE: GS + '!' + '\x00',
  CUT: GS + 'V' + '\x00',
  PARTIAL_CUT: GS + 'V' + '\x01',
  FEED: ESC + 'd' + '\x03',
  LINE: '--------------------------------\n',
  DOUBLE_LINE: '================================\n',
};

function formatCurrency(value) {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function buildOrderTicket(payload) {
  const lines = [];
  
  // Header
  lines.push(COMMANDS.INIT);
  lines.push(COMMANDS.ALIGN_CENTER);
  lines.push(COMMANDS.DOUBLE_SIZE);
  lines.push(COMMANDS.BOLD_ON);
  lines.push('CLUBE DE LAZER\n');
  lines.push('SHANGRI-LA\n');
  lines.push(COMMANDS.NORMAL_SIZE);
  lines.push(COMMANDS.BOLD_OFF);
  lines.push(COMMANDS.DOUBLE_LINE);
  
  // Order info
  lines.push(COMMANDS.ALIGN_LEFT);
  lines.push(COMMANDS.BOLD_ON);
  
  const tableInfo = payload.table_number === 0 
    ? 'BALCAO' 
    : `MESA ${payload.table_number}`;
  
  lines.push(COMMANDS.DOUBLE_HEIGHT);
  lines.push(`${tableInfo}\n`);
  lines.push(COMMANDS.NORMAL_SIZE);
  
  lines.push(`Cliente: ${payload.client_name || 'N/A'}\n`);
  
  const deliveryLabel = payload.delivery_type === 'balcao' 
    ? 'RETIRAR NO BALCAO' 
    : 'ENTREGAR NA MESA';
  lines.push(`>> ${deliveryLabel} <<\n`);
  lines.push(COMMANDS.BOLD_OFF);
  
  lines.push(COMMANDS.LINE);
  lines.push(`Data: ${formatDateTime(payload.created_at)}\n`);
  lines.push(COMMANDS.LINE);
  
  // Items
  lines.push(COMMANDS.BOLD_ON);
  lines.push('ITENS DO PEDIDO:\n');
  lines.push(COMMANDS.BOLD_OFF);
  lines.push('\n');
  
  let total = 0;
  const items = payload.items || [];
  
  items.forEach(item => {
    const itemTotal = item.quantity * item.price;
    total += itemTotal;
    
    lines.push(COMMANDS.BOLD_ON);
    lines.push(`${item.quantity}x ${item.name}\n`);
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(`   ${formatCurrency(item.price)} cada\n`);
    lines.push(`   Subtotal: ${formatCurrency(itemTotal)}\n`);
    lines.push('\n');
  });
  
  lines.push(COMMANDS.LINE);
  
  // Notes
  if (payload.notes) {
    lines.push(COMMANDS.BOLD_ON);
    lines.push('OBSERVACOES:\n');
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(`${payload.notes}\n`);
    lines.push(COMMANDS.LINE);
  }
  
  // Total
  lines.push(COMMANDS.ALIGN_CENTER);
  lines.push(COMMANDS.DOUBLE_HEIGHT);
  lines.push(COMMANDS.BOLD_ON);
  lines.push(`TOTAL: ${formatCurrency(total)}\n`);
  lines.push(COMMANDS.NORMAL_SIZE);
  lines.push(COMMANDS.BOLD_OFF);
  
  // Footer
  lines.push('\n');
  lines.push(COMMANDS.ALIGN_CENTER);
  lines.push('Obrigado pela preferencia!\n');
  lines.push('\n\n\n');
  lines.push(COMMANDS.PARTIAL_CUT);
  
  return lines.join('');
}

async function printToElgin(data) {
  return new Promise((resolve, reject) => {
    console.log(`[PRINT] Conectando a ${PRINTER_IP}:${PRINTER_PORT}...`);
    
    const client = new net.Socket();
    
    client.setTimeout(10000);
    
    client.on('timeout', () => {
      console.error('[PRINT] Timeout ao conectar na impressora');
      client.destroy();
      reject(new Error('Timeout ao conectar na impressora'));
    });
    
    client.on('error', (err) => {
      console.error('[PRINT] Erro de conexao:', err.message);
      reject(err);
    });
    
    client.connect(PRINTER_PORT, PRINTER_IP, () => {
      console.log('[PRINT] Conectado! Enviando dados...');
      
      // Convert to buffer with proper encoding for Portuguese
      const buffer = Buffer.from(data, 'latin1');
      
      client.write(buffer, () => {
        console.log('[PRINT] Dados enviados com sucesso!');
        client.end();
        resolve();
      });
    });
    
    client.on('close', () => {
      console.log('[PRINT] Conexao fechada');
    });
  });
}

async function processPrintJob(job) {
  console.log(`\n[JOB] Processando job ${job.id}...`);
  console.log(`[JOB] Tipo: ${job.job_type}`);
  
  try {
    // Mark as printing
    await supabase
      .from('print_jobs')
      .update({ status: 'printing' })
      .eq('id', job.id);
    
    // Build ticket
    const ticketData = buildOrderTicket(job.payload);
    
    // Send to printer
    await printToElgin(ticketData);
    
    // Mark as completed
    await supabase
      .from('print_jobs')
      .update({ 
        status: 'completed',
        printed_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    console.log(`[JOB] Job ${job.id} concluido com sucesso!`);
    
  } catch (error) {
    console.error(`[JOB] Erro ao processar job ${job.id}:`, error.message);
    
    // Mark as failed
    await supabase
      .from('print_jobs')
      .update({ 
        status: 'failed',
        error_message: error.message
      })
      .eq('id', job.id);
  }
}

async function processPendingJobs() {
  console.log('[STARTUP] Verificando jobs pendentes...');
  
  const { data: pendingJobs, error } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('[STARTUP] Erro ao buscar jobs pendentes:', error);
    return;
  }
  
  if (pendingJobs && pendingJobs.length > 0) {
    console.log(`[STARTUP] ${pendingJobs.length} job(s) pendente(s) encontrado(s)`);
    
    for (const job of pendingJobs) {
      await processPrintJob(job);
    }
  } else {
    console.log('[STARTUP] Nenhum job pendente');
  }
}

async function startRealtimeSubscription() {
  console.log('[REALTIME] Iniciando monitoramento de novos jobs...');
  
  const channel = supabase
    .channel('print-jobs-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'print_jobs'
      },
      async (payload) => {
        console.log('[REALTIME] Novo job de impressao detectado!');
        await processPrintJob(payload.new);
      }
    )
    .subscribe((status) => {
      console.log(`[REALTIME] Status da subscription: ${status}`);
    });
  
  return channel;
}

async function main() {
  console.log('========================================');
  console.log('  SERVIDOR DE IMPRESSAO - SHANGRI-LA   ');
  console.log('========================================');
  console.log(`Impressora: ${PRINTER_IP}:${PRINTER_PORT}`);
  console.log('');
  
  // Process any pending jobs first
  await processPendingJobs();
  
  // Start realtime monitoring
  await startRealtimeSubscription();
  
  console.log('\n[READY] Servidor pronto! Aguardando novos pedidos...\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Encerrando servidor...');
  process.exit(0);
});

main().catch(console.error);
