import { ProcurementProcess, type ProcessCallbacks } from './services/ProcurementProcess';

let running = false;
let speedDelay = 700;

const speedLabels: Record<string, string> = { '1':'Very Slow', '2':'Slow', '3':'Normal', '4':'Fast', '5':'Instant' };
const speedMs: Record<string, number> = { '1':1500, '2':1000, '3':700, '4':300, '5':50 };

document.addEventListener('DOMContentLoaded', () => {
  const speedEl = document.getElementById('speed') as HTMLInputElement;
  const speedLabelEl = document.getElementById('speedLabel');
  
  if (speedEl && speedLabelEl) {
    speedEl.addEventListener('input', function() {
      speedDelay = speedMs[this.value] || 700;
      speedLabelEl.textContent = speedLabels[this.value] || 'Normal';
    });
  }

  const runBtn = document.getElementById('runBtn');
  if (runBtn) {
    runBtn.addEventListener('click', runProcess);
  }
});

function sleep(ms: number = speedDelay): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function addLog(msg: string, type: string = 'info') {
  const body = document.getElementById('logBody');
  if (!body) return;
  
  const empty = body.querySelector('.log-empty');
  if (empty) empty.remove();

  const now = new Date();
  const time = now.toTimeString().slice(0,8);
  const line = document.createElement('div');
  line.className = 'log-line';
  line.innerHTML = `<span class="log-time">${time}</span><span class="log-msg ${type}">${msg}</span>`;
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

function setPhase(num: number, state: string) {
  const el = document.getElementById(`ph${num}`);
  if (el) el.className = `phase-step ${state}`;
}

function activateCard(cardId: string) {
  const el = document.getElementById(cardId);
  if (el) el.classList.add('active');
}

function updateCard(idEl: string, detailEl: string, badgeEl: string, id: string, detail: string, badgeClass: string, badgeText: string) {
  const idElem = document.getElementById(idEl);
  if (idElem) idElem.textContent = id;
  
  const detailElem = document.getElementById(detailEl);
  if (detailElem) detailElem.textContent = detail;
  
  const b = document.getElementById(badgeEl);
  if (b) {
    b.className = `doc-badge ${badgeClass}`;
    b.textContent = badgeText;
  }
}

function showResult(success: boolean, text: string) {
  const banner = document.getElementById('resultBanner');
  const icon = document.getElementById('resultIcon');
  const txt = document.getElementById('resultText');
  
  if (banner) banner.className = `result-banner ${success ? 'success' : 'fail'}`;
  if (icon) icon.textContent = success ? '✓' : '✗';
  if (txt) txt.textContent = text;
}

function resetUI() {
  [1,2,3,4].forEach(n => setPhase(n, ''));
  const banner = document.getElementById('resultBanner');
  if (banner) banner.className = 'result-banner';
  
  const logBody = document.getElementById('logBody');
  if (logBody) logBody.innerHTML = '<div class="log-empty">// Configure scenario above and press RUN to start the simulation.</div>';

  ['card-req','card-rfq','card-quote','card-po','card-delivery','card-invoice']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

  const resets: [string, string][] = [
    ['req-id','—'],['req-detail','Not generated'],['req-badge','badge-pending'],
    ['rfq-id','—'],['rfq-detail','Not created'],['rfq-badge','badge-pending'],
    ['quote-id','—'],['quote-detail','Not submitted'],['quote-badge','badge-pending'],
    ['po-id','—'],['po-detail','Not created'],['po-badge','badge-pending'],
    ['dn-id','—'],['dn-detail','Not issued'],['dn-badge','badge-pending'],
    ['inv-id','—'],['inv-detail','Not issued'],['inv-badge','badge-pending'],
  ];
  
  resets.forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) {
      if (id.endsWith('-badge')) { el.className = `doc-badge ${val}`; el.textContent = 'Pending'; }
      else el.textContent = val;
    }
  });
}

async function runProcess() {
  if (running) return;
  running = true;

  const runBtn = document.getElementById('runBtn') as HTMLButtonElement | null;
  if (runBtn) runBtn.disabled = true;
  
  resetUI();

  const itemDescEl = document.getElementById('itemDesc') as HTMLInputElement | null;
  const itemDesc = itemDescEl ? itemDescEl.value || 'Generic item' : 'Generic item';
  
  const sellerNameEl = document.getElementById('sellerName') as HTMLInputElement | null;
  const sellerName = sellerNameEl ? sellerNameEl.value || 'Vendor Co.' : 'Vendor Co.';
  
  const quoteAmountEl = document.getElementById('quoteAmount') as HTMLInputElement | null;
  const quoteAmount = quoteAmountEl ? parseFloat(quoteAmountEl.value) || 5000 : 5000;
  
  const requiresReviewEl = document.getElementById('requiresReview') as HTMLInputElement | null;
  const requiresReview = requiresReviewEl ? requiresReviewEl.checked : false;
  
  const supervisorRejectsEl = document.getElementById('supervisorRejects') as HTMLInputElement | null;
  const supervisorRejects = supervisorRejectsEl ? supervisorRejectsEl.checked : false;

  const callbacks: ProcessCallbacks = {
    logger: addLog,
    sleep: () => sleep(speedDelay),
    setPhase,
    activateCard,
    updateCard,
    showResult,
    onFinish: () => {
      running = false;
      if (runBtn) runBtn.disabled = false;
    }
  };

  const process = new ProcurementProcess(sellerName, callbacks);
  await process.run(itemDesc, requiresReview, quoteAmount, supervisorRejects);
}

// Add runProcess to window objects to be callable from inline onclick
(window as any).runProcess = runProcess;
