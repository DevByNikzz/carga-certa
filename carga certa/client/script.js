const KEY = 'carga-certa-simples-v1';
const colors = ['coral','lime','blue','purple','amber','pink'];
const baseExercises = [
  { id: 'supino', name: 'Supino reto', group: 'Peito' },
  { id: 'agachamento', name: 'Agachamento livre', group: 'Pernas' },
  { id: 'remada', name: 'Remada curvada', group: 'Costas' },
  { id: 'desenvolvimento', name: 'Desenvolvimento', group: 'Ombros' },
  { id: 'legpress', name: 'Leg press 45°', group: 'Pernas' },
  { id: 'rosca', name: 'Rosca direta', group: 'Braços' }
];
const emptyState = { exercises: baseExercises, logs: [], profile: { name: 'Atleta', goal: 'Consistência acima de tudo', avatar: '' }, light: false };
let state = load();

function load() { try { return { ...emptyState, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return structuredClone(emptyState); } }
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function id(prefix) { return prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2); }
function today() { return new Date().toISOString().slice(0, 10); }
function dateLabel(date) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(date + 'T12:00:00')).replace('.', ''); }
function monthLabel(date) { return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(date + 'T12:00:00')).replace('.', ''); }
function $(id) { return document.getElementById(id); }
function esc(value) { return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }
function exercise(idValue) { return state.exercises.find(item => item.id === idValue) || { name: 'Exercício', group: '', color: 'lime' }; }
function initials(name) { return name.trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'CC'; }
function orderedLogs() { return [...state.logs].sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)); }
function showToast(message) { const toast = $('toast'); toast.textContent = message; toast.classList.remove('hidden'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2600); }

function applyTheme() { document.documentElement.classList.toggle('light', state.light); $('theme-label').textContent = state.light ? 'Modo escuro' : 'Modo claro'; $('theme-switch').classList.toggle('on', state.light); }
function avatarMarkup(target, profile) { if (profile.avatar) { target.innerHTML = `<img src="${profile.avatar}" alt="Foto de ${esc(profile.name)}">`; } else target.textContent = initials(profile.name); }
function renderProfile() { ['sidebar-avatar','top-avatar','settings-avatar'].forEach(idName => avatarMarkup($(idName), state.profile)); $('sidebar-name').textContent = state.profile.name; $('sidebar-goal').textContent = state.profile.goal; $('top-name').textContent = state.profile.name; $('welcome-name').textContent = state.profile.name.split(' ')[0]; $('profile-preview-name').textContent = state.profile.name; $('profile-name').value = state.profile.name; $('profile-goal').value = state.profile.goal; }

function renderDashboard() {
  const logs = orderedLogs(), days = new Set(logs.map(l => l.date)).size, volume = logs.reduce((sum,l) => sum + l.weight*l.reps*l.sets, 0), best = logs.length ? Math.max(...logs.map(l => l.weight)) : 0, todayLogs = logs.filter(l => l.date === today());
  $('stat-days').textContent = `${days} ${days === 1 ? 'dia' : 'dias'}`; $('stat-volume').textContent = `${volume.toLocaleString('pt-BR')} kg`; $('stat-best').textContent = `${best} kg`; $('stat-goal').textContent = `${Math.min(days,4)}/4`; $('history-count').textContent = logs.length; $('total-count').textContent = logs.length;
  $('today-status').textContent = todayLogs.length ? `${todayLogs.length} registro${todayLogs.length > 1 ? 's' : ''} hoje` : 'Nenhum registro hoje'; $('progress-bar').style.width = `${Math.min(days / 4 * 100, 100)}%`; $('progress-label').textContent = `${Math.min(days,4)} de 4 treinos na meta semanal`;
  $('insight-title').textContent = logs.length ? 'Você está construindo ritmo.' : 'Seu progresso começa hoje.'; $('insight-text').textContent = logs.length ? 'Cada registro deixa seu próximo treino mais inteligente.' : 'Registre uma carga para transformar esforço em evolução visível.';
  const latest = state.exercises.map(ex => ({ ex, log: logs.find(l => l.exerciseId === ex.id) })).filter(x => x.log).slice(0, 4);
  $('latest-list').innerHTML = latest.length ? latest.map(({ex,log},i) => `<div class="latest-row"><span class="exercise-icon ${colors[i % colors.length]}">♧</span><span class="exercise-info"><strong>${esc(ex.name)}</strong><small>${esc(ex.group)} · ${dateLabel(log.date)}</small></span><span class="result"><b>${log.weight} kg</b><small>${log.sets} × ${log.reps}</small></span><button class="delete" data-delete="${log.id}">×</button></div>`).join('') : '<div class="empty">◌ <span>Seu histórico vai aparecer aqui depois do primeiro treino.</span></div>';
  const recent = logs.slice(0, 4); $('recent-list').innerHTML = recent.length ? recent.map(log => { const ex = exercise(log.exerciseId); return `<div class="recent-row"><span class="date-box ${ex.color || 'lime'}"><b>${new Date(log.date+'T12:00:00').getDate()}</b><small>${monthLabel(log.date)}</small></span><span><strong>${esc(ex.name)}</strong><small>${log.weight} kg · ${log.sets} séries de ${log.reps}</small></span><i>›</i></div>`; }).join('') : '<div class="empty centered">⌑<span>Sem atividade recente</span></div>';
}

function renderExercises() { $('exercise-grid').innerHTML = state.exercises.map((ex,i) => { const count = state.logs.filter(l => l.exerciseId === ex.id).length; return `<article class="exercise-card"><span class="exercise-icon large-icon ${colors[i % colors.length]}">♧</span><small>${esc(ex.group)}</small><h3>${esc(ex.name)}</h3><p>${count ? count + (count === 1 ? ' registro salvo' : ' registros salvos') : 'Ainda sem registros'}</p><button class="card-link" data-log-exercise="${ex.id}">Registrar carga ›</button></article>`; }).join('') + '<button class="exercise-card add-card" data-action="open-exercise"><span>＋</span><h3>Adicionar exercício</h3><p>Crie seu próprio movimento</p></button>'; }
function renderFilters() { $('history-filters').innerHTML = '<button class="filter active" data-filter="all">Todos</button>' + state.exercises.map(ex => `<button class="filter" data-filter="${ex.id}">${esc(ex.name)}</button>`).join(''); }
function renderHistory(filter='all') { const logs = orderedLogs().filter(l => filter === 'all' || l.exerciseId === filter); $('history-list').innerHTML = logs.length ? logs.map(log => { const ex = exercise(log.exerciseId); return `<div class="table-row"><span class="table-exercise"><span class="exercise-icon ${ex.color || 'lime'}">♧</span><span><strong>${esc(ex.name)}</strong><small>${esc(ex.group)}</small></span></span><span>${dateLabel(log.date)}</span><strong>${log.weight} kg <small>× ${log.reps} reps</small></strong><span>${(log.weight*log.reps*log.sets).toLocaleString('pt-BR')} kg</span><button class="delete" data-delete="${log.id}">×</button></div>`; }).join('') : '<div class="empty-state"><b>◷</b><h3>Nenhum registro encontrado</h3><p>Comece anotando uma carga no próximo treino.</p></div>'; }
function renderAll() { applyTheme(); renderProfile(); renderDashboard(); renderExercises(); renderFilters(); renderHistory(); updateDate(); }
function updateDate() { $('today-label').textContent = new Intl.DateTimeFormat('pt-BR', { weekday:'long', day:'numeric', month:'long' }).format(new Date()); }

function go(page) { document.querySelectorAll('.page').forEach(p => p.classList.toggle('hidden', p.id !== 'page-' + page)); document.querySelectorAll('[data-page]').forEach(item => item.classList.toggle('active', item.dataset.page === page)); $('sidebar').classList.remove('open'); window.scrollTo(0,0); }
function openModal(idName) { $(idName).classList.remove('hidden'); }
function closeModal(idName) { $(idName).classList.add('hidden'); }
function fillExerciseSelect(selected) { $('log-exercise').innerHTML = state.exercises.map(ex => `<option value="${ex.id}" ${ex.id === selected ? 'selected' : ''}>${esc(ex.name)} · ${esc(ex.group)}</option>`).join(''); updatePreview(); }
function updatePreview() { const ex = exercise($('log-exercise').value); $('preview-exercise').textContent = ex.name; $('preview-values').textContent = `${$('log-sets').value || 0} × ${$('log-reps').value || 0} · ${$('log-weight').value || 0} kg`; }
function openLog(exId) { fillExerciseSelect(exId || state.exercises[0].id); openModal('log-modal'); }
function saveLog() { const weight=Number($('log-weight').value), reps=Number($('log-reps').value), sets=Number($('log-sets').value); if (!weight || !reps || !sets) return showToast('Preencha carga, repetições e séries.'); state.logs.push({ id:id('log'), exerciseId:$('log-exercise').value, date:today(), weight, reps, sets, note:$('log-note').value }); save(); closeModal('log-modal'); renderAll(); showToast('Treino salvo neste aparelho.'); }
function saveExercise() { const name=$('new-exercise-name').value.trim(); if (!name) return showToast('Digite o nome do exercício.'); state.exercises.push({ id:id('exercise'), name, group:$('new-exercise-group').value }); save(); closeModal('exercise-modal'); renderAll(); showToast('Exercício adicionado.'); }
function removeLog(logId) { state.logs = state.logs.filter(l => l.id !== logId); save(); renderAll(); showToast('Registro removido.'); }
function saveProfile() { state.profile.name = $('profile-name').value.trim() || 'Atleta'; state.profile.goal = $('profile-goal').value.trim() || 'Consistência acima de tudo'; save(); renderProfile(); showToast('Perfil atualizado.'); }
function exportBackup() { const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}), a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`carga-certa-backup-${today()}.json`; a.click(); showToast('Backup exportado com sucesso.'); }
function importBackup(file) { if (!file) return; const reader=new FileReader(); reader.onload=()=>{ try { const data=JSON.parse(reader.result); if(!data.exercises || !data.logs || !data.profile) throw Error(); state={...emptyState,...data}; save(); renderAll(); showToast('Backup restaurado.'); } catch { showToast('Arquivo de backup inválido.'); } }; reader.readAsText(file); }

// Navegação e cliques
 document.addEventListener('click', e => { const page=e.target.closest('[data-page]'); if(page) return go(page.dataset.page); const action=e.target.closest('[data-action]')?.dataset.action; if(action==='open-log') return openLog(); if(action==='close-modal') return closeModal('log-modal'); if(action==='open-exercise') { closeModal('log-modal'); return openModal('exercise-modal'); } if(action==='close-exercise') return closeModal('exercise-modal'); const logEx=e.target.closest('[data-log-exercise]'); if(logEx) return openLog(logEx.dataset.logExercise); const del=e.target.closest('[data-delete]'); if(del && confirm('Apagar este registro?')) return removeLog(del.dataset.delete); const filter=e.target.closest('[data-filter]'); if(filter) { document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active')); filter.classList.add('active'); return renderHistory(filter.dataset.filter); } });
$('save-log').onclick=saveLog; $('save-exercise').onclick=saveExercise; $('save-profile').onclick=saveProfile; $('theme-toggle').onclick=()=>{state.light=!state.light; save(); applyTheme();}; $('settings-theme').onclick=()=>{state.light=!state.light; save(); applyTheme();}; $('export-data').onclick=exportBackup; $('import-data').onclick=()=> $('backup-file').click(); $('backup-file').onchange=e=>importBackup(e.target.files[0]); $('reset-data').onclick=()=>{if(confirm('Apagar todos os treinos e voltar ao início?')) { state=structuredClone(emptyState); save(); renderAll(); showToast('Dados apagados deste aparelho.'); }}; $('open-menu').onclick=()=> $('sidebar').classList.add('open'); $('close-menu').onclick=()=> $('sidebar').classList.remove('open');
['log-weight','log-reps','log-sets','log-exercise'].forEach(idName=>$(idName).addEventListener('input',updatePreview)); $('avatar-button').onclick=()=> $('avatar-file').click(); $('avatar-file').onchange=e=>{const file=e.target.files[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{state.profile.avatar=reader.result; save(); renderProfile(); showToast('Foto atualizada.');}; reader.readAsDataURL(file);};
window.addEventListener('click',e=>{ if(e.target.classList.contains('modal-backdrop')) e.target.classList.add('hidden'); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
renderAll();
