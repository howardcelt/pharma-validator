/* Pharma GMP - Electronic Batch Record */

document.addEventListener('DOMContentLoaded', () => {
    loadEBR();
});

async function loadEBR() {
    try {
        const res = await fetch(`/api/batch/${BATCH_ID}/ebr`);
        const data = await res.json();
        const ebr = data.ebr;
        const batch = ebr.batch;

        document.getElementById('ebrContent').innerHTML = `
            <div class="ebr-header">
                <h2>Electronic Batch Record</h2>
                <p>EBR ID: <strong>${ebr.ebr_id}</strong></p>
                <p class="ebr-hash">Integrity Hash: ${ebr.integrity_hash}</p>
                <p>Generated: ${new Date(ebr.generated_at).toLocaleString()}</p>
            </div>

            <div class="ebr-section-title">📋 Batch Information</div>
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Product</span><span class="detail-value">${batch.product_name}</span></div>
                <div class="detail-item"><span class="detail-label">Batch ID</span><span class="detail-value">${batch.batch_id}</span></div>
                <div class="detail-item"><span class="detail-label">Strength</span><span class="detail-value">${batch.strength}</span></div>
                <div class="detail-item"><span class="detail-label">Form</span><span class="detail-value">${batch.dosage_form}</span></div>
                <div class="detail-item"><span class="detail-label">Size</span><span class="detail-value">${batch.batch_size.toLocaleString()}</span></div>
                <div class="detail-item"><span class="detail-label">MPR</span><span class="detail-value">${batch.mpr_id}</span></div>
            </div>

            <div class="ebr-section-title">🔬 Process Steps</div>
            ${batch.steps.length ? batch.steps.map((s, i) => `
                <div class="detail-item">
                    <span class="detail-label">Step ${i+1}: ${s.stage}</span>
                    <span class="detail-value">${s.status} | ${s.operator_id || 'N/A'}</span>
                </div>
            `).join('') : '<p style="color:#9fa8da">No steps recorded</p>'}

            <div class="ebr-section-title">📊 Process Parameters</div>
            ${batch.parameters.length ? batch.parameters.map(p => `
                <div class="detail-item">
                    <span class="detail-label">${p.name}</span>
                    <span class="detail-value" style="color:${(p.min_limit <= p.value && p.value <= p.max_limit) ? '#00c853' : '#ff1744'}">
                        ${p.value} ${p.unit} [${p.min_limit}-${p.max_limit}]
                    </span>
                </div>
            `).join('') : '<p style="color:#9fa8da">No parameters</p>'}

            <div class="ebr-section-title">⚠️ Deviations</div>
            ${batch.deviations.length ? batch.deviations.map(d => `
                <div class="detail-item">
                    <span class="detail-label">${d.parameter}</span>
                    <span class="detail-value" style="color:#ff1744">${d.value} @ ${d.stage}</span>
                </div>
            `).join('') : '<p style="color:#9fa8da">No deviations</p>'}

            <div class="ebr-section-title">📜 Audit Trail</div>
            ${batch.audit_trail.length ? batch.audit_trail.map(a => `
                <div class="detail-item">
                    <span class="detail-label">${new Date(a.timestamp).toLocaleString()}</span>
                    <span class="detail-value">${a.action} <small>by ${a.user_id}</small></span>
                </div>
            `).join('') : '<p style="color:#9fa8da">No audit entries</p>'}

            <div class="ebr-section-title">✅ QA Release</div>
            ${batch.qa_release ? `
                <div class="detail-item">
                    <span class="detail-label">Decision</span>
                    <span class="detail-value" style="color:${batch.qa_release.decision === 'Approved' ? '#00c853' : '#ff1744'}">${batch.qa_release.decision}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">QA Officer</span>
                    <span class="detail-value">${batch.qa_release.qa_id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Comments</span>
                    <span class="detail-value">${batch.qa_release.comments}</span>
                </div>
            ` : '<p style="color:#9fa8da">Pending QA review</p>'}
        `;
    } catch (e) { console.error('EBR error:', e); }
}
