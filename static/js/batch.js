/* Pharma GMP - Batch Detail Page */

document.addEventListener('DOMContentLoaded', () => {
    loadBatchDetail();
});

async function loadBatchDetail() {
    try {
        const res = await fetch(`/api/batch/${BATCH_ID}`);
        const data = await res.json();

        // Batch info
        const b = data.batch;
        document.getElementById('batchInfo').innerHTML = `
            <div class="detail-item"><span class="detail-label">Product</span><span class="detail-value">${b.product_name}</span></div>
            <div class="detail-item"><span class="detail-label">Strength</span><span class="detail-value">${b.strength}</span></div>
            <div class="detail-item"><span class="detail-label">Dosage Form</span><span class="detail-value">${b.dosage_form}</span></div>
            <div class="detail-item"><span class="detail-label">Batch Size</span><span class="detail-value">${b.batch_size.toLocaleString()}</span></div>
            <div class="detail-item"><span class="detail-label">MPR ID</span><span class="detail-value">${b.mpr_id}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${b.status}</span></div>
            <div class="detail-item"><span class="detail-label">Current Stage</span><span class="detail-value">${b.current_stage}</span></div>
            <div class="detail-item"><span class="detail-label">Initiated By</span><span class="detail-value">${b.initiated_by}</span></div>
            <div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">${new Date(b.created_at).toLocaleString()}</span></div>
        `;

        // Parameters
        const params = data.parameters;
        document.getElementById('paramList').innerHTML = params.length ? params.map(p => `
            <div class="detail-item">
                <span class="detail-label">${p.name}</span>
                <span class="detail-value" style="color:${p.in_spec ? '#00c853' : '#ff1744'}">${p.value} ${p.unit} ${p.in_spec ? '✓' : '✗'}</span>
            </div>
        `).join('') : '<p style="color:#9fa8da">No parameters recorded</p>';

        // Deviations
        const devs = data.deviations;
        document.getElementById('deviationList').innerHTML = devs.length ? devs.map(d => `
            <div class="detail-item">
                <span class="detail-label">${d.parameter}</span>
                <span class="detail-value" style="color:#ff1744">${d.value} (spec: ${d.limits})</span>
            </div>
        `).join('') : '<p style="color:#9fa8da">No deviations recorded</p>';

        // Audit trail
        const audit = data.audit_trail;
        document.getElementById('auditList').innerHTML = audit.length ? audit.map(a => `
            <div class="detail-item">
                <span class="detail-label">${new Date(a.timestamp).toLocaleTimeString()}</span>
                <span class="detail-value">${a.action} <small style="color:#9fa8da">by ${a.user_id}</small></span>
            </div>
        `).join('') : '<p style="color:#9fa8da">No audit entries</p>';

    } catch (e) { console.error('Batch detail error:', e); }
}

async function validateBatch() {
    try {
        const res = await fetch(`/api/batch/${BATCH_ID}/validate`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            alert(`GMP Validation: ${data.report.overall_status}\nRisk Score: ${data.report.risk_score}\nViolations: ${data.report.violations.length}`);
        }
    } catch (e) { alert('Validation failed'); }
}

async function viewCOA() {
    window.open(`/api/batch/${BATCH_ID}/coa`, '_blank');
}

async function viewEBR() {
    window.location.href = `/ebr/${BATCH_ID}`;
}

async function qaRelease(decision) {
    const comments = prompt(`QA ${decision} comments:`, '');
    if (comments === null) return;

    try {
        const res = await fetch(`/api/batch/${BATCH_ID}/qa_release`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qa_id: 'QA001', decision, comments })
        });
        const data = await res.json();
        if (data.success) {
            alert(`Batch ${decision}`);
            loadBatchDetail();
        }
    } catch (e) { alert('QA release failed'); }
}
