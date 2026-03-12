import { ProcurementProcess, type ProcessCallbacks } from './services/ProcurementProcess';
import { LinkedList } from './models/LinkedList';

// Interfaces for our pending items
interface PendingItem {
  id: string;
  description: string;
  amount: number;
}

let pendingItems: PendingItem[] = [];
let processInstance: ProcurementProcess;

// Mock callbacks for manual process
const callbacks: ProcessCallbacks = {
  logger: addLog,
  setPhase: () => {}, // Not used in manual mode
  activateCard: () => {}, // Not used in manual mode
  updateCard: () => {}, // Not used in manual mode
  showResult: showResult,
  renderList: renderLinkedList,
  onFinish: () => {}
};

document.addEventListener('DOMContentLoaded', () => {
  processInstance = new ProcurementProcess("Acme Supplies Inc.", callbacks);

  const addBtn = document.getElementById('addBtn');
  if (addBtn) {
    addBtn.addEventListener('click', onAddItem);
  }

  renderPendingList();
  renderLinkedList(processInstance.documentList);
});

function onAddItem() {
  const descEl = document.getElementById('itemDesc') as HTMLInputElement;
  const desc = descEl ? descEl.value || 'Generic item' : 'Generic item';
  
  // Clear input
  if(descEl) descEl.value = '';

  const id = `REQ-${Math.floor(Math.random() * 9000) + 1000}`;
  
  pendingItems.push({
    id,
    description: desc,
    amount: 5000 // Default quote for demo
  });

  addLog(`New Requisition request added: ${id}`, 'success');
  renderPendingList();
}

function onDeleteItem(id: string) {
  pendingItems = pendingItems.filter(item => item.id !== id);
  addLog(`Requisition request ${id} deleted.`, 'warn');
  renderPendingList();
}

function onEditItem(id: string) {
  const item = pendingItems.find(i => i.id === id);
  if (!item) return;

  const newDesc = prompt("Edit Item Description:", item.description);
  if (newDesc !== null && newDesc.trim() !== "") {
    item.description = newDesc.trim();
    addLog(`Requisition request ${id} updated.`, 'info');
    renderPendingList();
  }
}

async function onProcessItem(id: string) {
  const itemIndex = pendingItems.findIndex(i => i.id === id);
  if (itemIndex === -1) return;
  
  const item = pendingItems[itemIndex];
  
  // Remove from pending list immediately
  pendingItems.splice(itemIndex, 1);
  renderPendingList();
  
  addLog(`Processing Requisition ${item.id}...`, 'accent');
  
  // Execute process for this single item
  await processInstance.run(item.description, false, item.amount, false);
}

function renderPendingList() {
  const container = document.getElementById('pendingListBody');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (pendingItems.length === 0) {
    container.innerHTML = '<div class="log-empty">// No pending requisitions right now. Add one above.</div>';
    return;
  }

  pendingItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'pending-item';
    
    el.innerHTML = `
      <div class="pending-info">
        <span class="pending-id">${item.id}</span>
        <span class="pending-desc">${item.description}</span>
      </div>
      <div class="pending-actions">
        <button class="btn-sm" onclick="window.editItem('${item.id}')">Edit</button>
        <button class="btn-sm danger" onclick="window.deleteItem('${item.id}')">Delete</button>
        <button class="btn-sm primary" onclick="window.processItem('${item.id}')">Process ➔</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderLinkedList(list: LinkedList<any>) {
  const container = document.getElementById('linkedListView');
  if (!container) return;
  container.innerHTML = '';
  
  const items = list.toArray();
  
  if (items.length === 0) {
    container.innerHTML = '<div class="log-empty" style="width:100%">// Document LinkedList visualization will appear here.</div>';
    return;
  }

  items.forEach((item, index) => {
    const { type, data } = item;
    
    // Check if data is an object and has an ID property, or generic string
    let dataLabel = (data && data.id) ? data.id : "Document";

    const nodeEl = document.createElement('div');
    nodeEl.className = 'll-node';
    nodeEl.innerHTML = `
      <span class="ll-node-type">${type.replace('_', ' ')}</span>
      <span class="ll-node-id">${dataLabel}</span>
    `;
    container.appendChild(nodeEl);

    // Arrow if not last
    if (index !== items.length - 1) {
      const arrowEl = document.createElement('div');
      arrowEl.className = 'll-arrow';
      arrowEl.innerHTML = '➔';
      container.appendChild(arrowEl);
    }
  });
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

function showResult(success: boolean, text: string) {
  const banner = document.getElementById('resultBanner');
  const icon = document.getElementById('resultIcon');
  const txt = document.getElementById('resultText');
  
  if (banner) banner.className = `result-banner ${success ? 'success' : 'fail'}`;
  if (icon) icon.textContent = success ? '✓' : '✗';
  if (txt) txt.textContent = text;
}

// Global exposure for inline events
(window as any).editItem = onEditItem;
(window as any).deleteItem = onDeleteItem;
(window as any).processItem = onProcessItem;
