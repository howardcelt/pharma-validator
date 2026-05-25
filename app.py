"""
Pharmaceutical Batch Validation & GMP Compliance System
Flask Application Entry Point

Run: python app.py
Open: http://localhost:5000
"""

import os
import json
import random
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, jsonify, request, send_file

from pharma.batch_manager import BatchManager, BatchStage, BatchStep, ProcessParameter
from pharma.compliance_engine import ComplianceEngine
from pharma.database import PharmaDatabase

app = Flask(__name__)
app.config['SECRET_KEY'] = 'pharma-gmp-secret-2026'

# Global state
manager = BatchManager()
engine = ComplianceEngine()
db = PharmaDatabase()

# ==========================================
# ROUTES
# ==========================================

@app.route('/')
def dashboard():
    """Main GMP compliance dashboard."""
    return render_template('index.html')

@app.route('/batch/<batch_id>')
def batch_detail(batch_id):
    """Individual batch detail view."""
    return render_template('batch.html', batch_id=batch_id)

@app.route('/ebr/<batch_id>')
def ebr_view(batch_id):
    """Electronic Batch Record view."""
    return render_template('ebr.html', batch_id=batch_id)

@app.route('/reports')
def reports():
    """Compliance reports center."""
    return render_template('reports.html')

# ==========================================
# API: Batches
# ==========================================

@app.route('/api/batches', methods=['GET'])
def api_batches():
    """List all batches."""
    df = db.get_batches(50)
    records = df.to_dict('records') if not df.empty else []
    # Parse JSON data field
    for r in records:
        try:
            r['data'] = json.loads(r['data']) if r.get('data') else {}
        except:
            r['data'] = {}
    return jsonify({'batches': records, 'count': len(records)})

@app.route('/api/batch/<batch_id>', methods=['GET'])
def api_batch(batch_id):
    """Get single batch details."""
    batch = db.get_batch(batch_id)
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404

    params = db.get_parameters(batch_id)
    deviations = db.get_deviations(batch_id)
    audit = db.get_audit_trail(batch_id)

    return jsonify({
        'batch': batch,
        'parameters': params.to_dict('records') if not params.empty else [],
        'deviations': deviations.to_dict('records') if not deviations.empty else [],
        'audit_trail': audit.to_dict('records') if not audit.empty else [],
        'summary': manager.get_batch_summary(batch_id) if batch_id in manager.batches else {}
    })

@app.route('/api/batch/create', methods=['POST'])
def api_create_batch():
    """Create new batch."""
    data = request.get_json() or {}
    product = data.get('product', 'Paracetamol 500mg')
    strength = data.get('strength', '500mg')
    form = data.get('dosage_form', 'Tablet')
    size = data.get('batch_size', 100000)
    initiator = data.get('initiator', 'OP001')
    mpr = data.get('mpr_id', f'MPR-{datetime.now().strftime("%Y-%m")}-001')

    # Update manager defaults
    manager.product_name = product
    manager.strength = strength
    manager.dosage_form = form
    manager.batch_size = size

    batch_id = manager.create_batch(initiator_id=initiator, mpr_id=mpr)

    # Save to DB
    db.save_batch(manager.batches[batch_id])
    for entry in manager.batches[batch_id]['audit_trail']:
        db.save_audit(batch_id, entry)

    return jsonify({'success': True, 'batch_id': batch_id, 'batch': manager.batches[batch_id]})

@app.route('/api/batch/<batch_id>/advance', methods=['POST'])
def api_advance_stage(batch_id):
    """Advance batch to next stage."""
    data = request.get_json() or {}
    stage_name = data.get('stage', 'Mixing / Blending')
    operator = data.get('operator', 'OP001')

    stage_map = {s.value: s for s in BatchStage}
    stage = stage_map.get(stage_name, BatchStage.MIXING)

    batch = manager.advance_stage(batch_id, stage, operator)
    db.save_batch(batch)
    for entry in batch['audit_trail'][-1:]:
        db.save_audit(batch_id, entry)

    return jsonify({'success': True, 'batch': batch})

@app.route('/api/batch/<batch_id>/parameter', methods=['POST'])
def api_record_parameter(batch_id):
    """Record process parameter."""
    data = request.get_json() or {}

    param = ProcessParameter(
        name=data.get('name', 'weight_mg'),
        value=data.get('value', 500.0),
        unit=data.get('unit', 'mg'),
        min_limit=data.get('min', 480.0),
        max_limit=data.get('max', 520.0),
        timestamp=datetime.now().isoformat(),
        operator_id=data.get('operator', 'OP001'),
        equipment_id=data.get('equipment', 'COMP-01')
    )

    result = manager.record_parameter(batch_id, param)
    db.save_parameter(batch_id, asdict(param))

    if not result['in_spec']:
        # Save deviation
        batch = manager.batches[batch_id]
        for dev in batch['deviations']:
            if dev['parameter'] == param.name and dev['timestamp'] == param.timestamp:
                db.save_deviation(batch_id, dev)

    db.save_batch(manager.batches[batch_id])

    return jsonify({'success': True, 'result': result})

@app.route('/api/batch/<batch_id>/qa_release', methods=['POST'])
def api_qa_release(batch_id):
    """QA release or reject batch."""
    data = request.get_json() or {}
    qa_id = data.get('qa_id', 'QA001')
    decision = data.get('decision', 'Approved')
    comments = data.get('comments', '')

    batch = manager.qa_release(batch_id, qa_id, decision, comments)
    db.save_batch(batch)
    for entry in batch['audit_trail'][-1:]:
        db.save_audit(batch_id, entry)

    return jsonify({'success': True, 'batch': batch})

# ==========================================
# API: Compliance & Reports
# ==========================================

@app.route('/api/batch/<batch_id>/validate', methods=['POST'])
def api_validate(batch_id):
    """Run GMP compliance validation."""
    batch = db.get_batch(batch_id)
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404

    report = engine.validate_batch(batch)
    db.save_compliance_report(report)

    return jsonify({'success': True, 'report': report})

@app.route('/api/batch/<batch_id>/coa', methods=['GET'])
def api_coa(batch_id):
    """Generate Certificate of Analysis."""
    batch = db.get_batch(batch_id)
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404

    coa = engine.generate_coa(batch)
    return jsonify({'success': True, 'coa': coa})

@app.route('/api/batch/<batch_id>/ebr', methods=['GET'])
def api_ebr(batch_id):
    """Generate Electronic Batch Record."""
    batch = db.get_batch(batch_id)
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404

    ebr = manager.generate_ebr(batch_id)
    ebr['integrity_hash'] = engine.hash_ebr(ebr)

    return jsonify({'success': True, 'ebr': ebr})

@app.route('/api/batch/<batch_id>/deviations', methods=['GET'])
def api_deviations(batch_id):
    """Get deviation report."""
    batch = db.get_batch(batch_id)
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404

    report = engine.generate_deviation_report(batch)
    return jsonify({'success': True, 'report': report})

@app.route('/api/reports/compliance', methods=['GET'])
def api_compliance_reports():
    """Get all compliance reports."""
    df = db.get_compliance_reports()
    records = df.to_dict('records') if not df.empty else []
    return jsonify({'reports': records})

@app.route('/api/stats', methods=['GET'])
def api_stats():
    """Dashboard statistics."""
    batches = db.get_batches(1000)
    deviations = db.get_deviations()

    total = len(batches)
    approved = len(batches[batches['status'] == 'Approved']) if not batches.empty else 0
    rejected = len(batches[batches['status'] == 'Rejected']) if not batches.empty else 0
    in_progress = len(batches[batches['status'] == 'In Progress']) if not batches.empty else 0
    deviation_count = len(deviations)

    return jsonify({
        'total_batches': total,
        'approved': int(approved),
        'rejected': int(rejected),
        'in_progress': int(in_progress),
        'open_deviations': int(deviation_count),
        'compliance_rate': round((approved / max(total, 1)) * 100, 1)
    })

# ==========================================
# DEMO: Auto-generate sample batches
# ==========================================

@app.route('/api/demo/generate', methods=['POST'])
def api_demo_generate():
    """Generate demo batches with realistic data."""
    data = request.get_json() or {}
    count = data.get('count', 3)
    created = []

    for i in range(count):
        batch_id = manager.create_batch(
            initiator_id=f"OP{random.randint(1,20):03d}",
            mpr_id=f"MPR-2026-{random.randint(100,999)}"
        )

        # Simulate manufacturing stages
        stages = [
            BatchStage.RAW_MATERIALS_CHECK,
            BatchStage.MIXING,
            BatchStage.GRANULATION,
            BatchStage.DRYING,
            BatchStage.COMPRESSION,
            BatchStage.COATING,
            BatchStage.PACKAGING,
            BatchStage.QC_TESTING
        ]

        for stage in stages:
            manager.advance_stage(batch_id, stage, f"OP{random.randint(1,20):03d}")

            # Generate stage-specific parameters
            if stage == BatchStage.COMPRESSION:
                for _ in range(5):
                    p = ProcessParameter(
                        name=random.choice(['weight_mg', 'thickness_mm', 'hardness_n', 'friability_pct']),
                        value=random.uniform(480, 530),
                        unit='mg' if 'weight' in random.choice(['weight_mg']) else 'mm',
                        min_limit=480, max_limit=520,
                        timestamp=datetime.now().isoformat(),
                        operator_id=f"OP{random.randint(1,20):03d}",
                        equipment_id="COMP-01"
                    )
                    manager.record_parameter(batch_id, p)
                    db.save_parameter(batch_id, asdict(p))

            elif stage == BatchStage.DRYING:
                p = ProcessParameter(
                    name='moisture_final_pct',
                    value=random.uniform(1.0, 3.0),
                    unit='%',
                    min_limit=0.5, max_limit=2.0,
                    timestamp=datetime.now().isoformat(),
                    operator_id=f"OP{random.randint(1,20):03d}",
                    equipment_id="DRY-03"
                )
                manager.record_parameter(batch_id, p)
                db.save_parameter(batch_id, asdict(p))

        # Random QA decision
        if random.random() > 0.2:
            manager.qa_release(batch_id, f"QA{random.randint(1,5):03d}", "Approved", "Meets all specifications")
        else:
            manager.qa_release(batch_id, f"QA{random.randint(1,5):03d}", "Rejected", "Out of specification parameters")

        db.save_batch(manager.batches[batch_id])
        for entry in manager.batches[batch_id]['audit_trail']:
            db.save_audit(batch_id, entry)
        for dev in manager.batches[batch_id]['deviations']:
            db.save_deviation(batch_id, dev)

        created.append(batch_id)

    return jsonify({'success': True, 'created': created, 'count': len(created)})

# Helper
def asdict(obj):
    from dataclasses import asdict
    return asdict(obj)

# ==========================================
# MAIN
# ==========================================

if __name__ == '__main__':
    print("=" * 60)
    print("PHARMA GMP VALIDATOR v2.0")
    print("21 CFR Part 11 | Electronic Batch Records | GMP Compliance")
    print("=" * 60)
    print("Open http://localhost:5000 in your browser")
    print("Press Ctrl+C to stop")
    print("=" * 60)

    Path("data").mkdir(exist_ok=True)
    Path("reports").mkdir(exist_ok=True)

    app.run(host='0.0.0.0', port=5000, debug=False)
