/* Pharma GMP - Compliance Reports */

document.addEventListener('DOMContentLoaded', () => {
    loadReports();
});

async function loadReports() {
    try {
        const res = await fetch('/api/reports/compliance');
        const data = await res.json();
        const container = document.getElementById('reportsList');

        if (!data.reports || data.reports.length === 0) {
            container.innerHTML = '<p style="color:#9fa8da;text-align:center;padding:40px">No compliance reports generated yet.</p>';
            return;
        }

        container.innerHTML = data.reports.map(r => {
            const content = JSON.parse(r.content || '{}');
            const severityClass = r.risk_score > 50 ? 'critical' : (r.risk_score > 20 ? 'major' : 'minor');
            return `
                <div class="report-card ${severityClass}">
                    <div class="report-header">
                        <span class="report-title">${r.report_type} - ${r.batch_id}</span>
                        <span class="report-risk">Risk: ${r.risk_score}/100</span>
                    </div>
                    <p style="color:#9fa8da;font-size:13px">Status: ${r.status} | Generated: ${new Date(r.generated_at).toLocaleString()}</p>
                    ${content.violations ? `<p style="font-size:12px;margin-top:8px">Violations: ${content.violations.length}</p>` : ''}
                </div>
            `;
        }).join('');
    } catch (e) { console.error('Reports error:', e); }
}
