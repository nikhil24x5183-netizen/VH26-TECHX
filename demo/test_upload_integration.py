import sys
from pathlib import Path
import httpx
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import json

if len(sys.argv) > 1 and sys.argv[1] == "--live":
    print("Connecting to LIVE Vercel Production: https://rag-troubleshooting-assistant.vercel.app")
    client = httpx.Client(base_url="https://rag-troubleshooting-assistant.vercel.app", timeout=30.0)
else:
    print("Connecting to Local TestClient")
    from fastapi.testclient import TestClient
    from api.index import app
    client = TestClient(app)


sample_manual = '''RoboWeld Pro 3000 Service & Maintenance Manual
Model: RoboWeld Pro 3000
Manufacturer: Robotics Precision Systems

Section 1.0: Safety Protocols
Ensure main breaker is tagged out before servicing wire feed assembly.

--- Page 2 ---
Section 2.1: Wire Feed System Diagnostics
Issue: Wire Feed Drive Motor Stall
Error E301: Wire Feed Drive Motor Stall
Description: Error E301 triggers when the digital wire feeder current sensor exceeds 8.5 Amps for more than 250 milliseconds, indicating drive roll mechanical jamming, liner blockage, or motor gearbox seizure.
Probable Causes:
1. Bird-nesting or tangled welding wire at the inlet guide tube.
2. Severely worn or clogged gun contact tip diameter.
3. Excessive drive roll tension crushing soft aluminum filler wire.
4. Planetary gearbox mechanical binding or failed armature bearing.
Step-by-Step Corrective Action:
1. Release the dual-roller quick-release pressure arm and inspect the inlet wire spool.
2. Cut away kinked or bird-nested wire using hardened wire cutters.
3. Remove the front contact tip and unscrew the gas diffuser to inspect for copper particulate clogging.
4. Measure wire feed drive motor terminal voltage across pins M1 and M2 (nominal 24V C).
5. Reset the feeder microprocessor fault register via front control panel switch SW2.
'''

def run_test():
    print("Testing Custom Manual Upload & Admin Authorization Guard...")
    
    # 0. Test Operator / Unauthenticated Upload Attempt (Should be HTTP 403 Forbidden)
    files_unauth = {'file': ('RoboWeld_Pro_3000_Manual.txt', sample_manual.encode('utf-8'), 'text/plain')}
    res_unauth = client.post('/api/upload', files=files_unauth, data={'machine_name': 'RoboWeld Pro 3000'})
    print('Unauthorized Upload HTTP Status:', res_unauth.status_code)
    assert res_unauth.status_code == 403, f"Expected 403 for unauthorized upload without brand, got {res_unauth.status_code}"
    print("  [PASS] Non-admin upload correctly rejected with HTTP 403 Forbidden!")

    # 1. Test Authorized Company Admin Upload with full equipment metadata
    files = {'file': ('RoboWeld_Pro_3000_Manual.txt', sample_manual.encode('utf-8'), 'text/plain')}
    res = client.post('/api/upload', files=files, data={
        'machine_name': 'RoboWeld Pro 3000',
        'brand': 'RoboWeld Industrial',
        'model_no': 'RW-3000X',
        'year_of_manufacture': '2023'
    })
    print('Authorized Admin Upload HTTP Status:', res.status_code)
    data = res.json()
    print('Uploaded Machine:', data.get('machine_name'))
    print('Detected Codes:', data.get('detected_codes'))
    print('Total Pages:', data.get('total_pages'))
    print('Chunks Created:', data.get('chunks_count'))

    assert res.status_code == 200
    assert data['machine_name'] == 'RoboWeld Pro 3000'
    assert 'E301' in data['detected_codes']

    # 2. Test Query for E301 on the newly uploaded machine
    print("\nTesting Grounded Query on Uploaded Manual:")
    q_res = client.post('/api/query', json={'query': 'What does error E301 mean on RoboWeld Pro 3000?'}).json()
    print('Query Status:', q_res['status'])
    print('Machine:', q_res['machine_name'])
    print('Error Code:', q_res['error_code'])
    print('Meaning:', q_res['error_meaning'][:80])
    doc_name = q_res['citations'][0].get('manual_name') or q_res['citations'][0].get('doc_name')
    print('Citation:', doc_name, 'Page:', q_res['citations'][0]['page'])
    print('Causes count:', len(q_res['probable_causes']))
    print('Steps count:', len(q_res['corrective_actions']))
    assert q_res['status'] == 'SUCCESS'
    assert q_res['citations'][0]['page'] == 2
    assert len(q_res['probable_causes']) >= 3
    assert len(q_res['corrective_actions']) >= 4

    # 3. Test Unknown Code Refusal on New Machine
    print("\nTesting Unknown Code Refusal on Uploaded Machine:")
    q_refuse = client.post('/api/query', json={'query': 'What does error E999 mean on RoboWeld Pro 3000?'}).json()
    print('Refusal Status:', q_refuse['status'])
    print('Refusal Message:', q_refuse['message'][:80])
    assert q_refuse['status'] == 'REFUSED_INSUFFICIENT_INFORMATION'

    # 4. Check manuals registry endpoint
    m_res = client.get('/api/manuals').json()
    print('\nTotal Manuals:', m_res['total_manuals'])
    manual_names = [m['name'] for m in m_res['manuals']]
    print('Registered Manuals:', manual_names)
    
    # 5. Test JSON Text Upload Endpoint (/api/upload/text)
    print("\nTesting JSON Text Upload Endpoint (/api/upload/text)...")
    # Verify 403 rejection without brand
    unauth_json = client.post('/api/upload/text', json={
        'filename': 'LaserCutter_Manual.pdf',
        'machine_name': 'LaserCutter Ultra 900',
        'pages': [{'page_num': 1, 'text': 'Test'}]
    })
    assert unauth_json.status_code == 403
    print("  [PASS] JSON upload without admin metadata correctly rejected with HTTP 403!")

    # Verify authorized admin upload with full metadata
    json_res = client.post('/api/upload/text', json={
        'filename': 'LaserCutter_Manual.pdf',
        'brand': 'LaserTech Systems',
        'machine_name': 'LaserCutter Ultra 900',
        'model_no': 'LT-900',
        'year_of_manufacture': '2024',
        'pages': [
            {'page_num': 1, 'text': 'LaserCutter Ultra 900 Technical Handbook\nSection 1 Safety Protocol'},
            {'page_num': 2, 'text': 'Section 3.1: Optical Tube Failure\nError E510: Optical Laser Tube Discharge Failure\nProbable Causes:\n1. RF Power Supply inverter trip.\n2. Deionized chiller flow rate < 1.8 L/min.\nStep-by-Step Corrective Action:\n1. Check chiller level.\n2. Cycle breaker CB4.'}
        ]
    })
    print('Authorized JSON Upload HTTP Status:', json_res.status_code)
    j_data = json_res.json()
    assert json_res.status_code == 200
    assert j_data['machine_name'] == 'LaserCutter Ultra 900'
    assert 'E510' in j_data['detected_codes']

    # 6. Test Query on JSON uploaded manual
    q_json = client.post('/api/query', json={
        'query': 'What does error E510 mean on LaserCutter Ultra 900?'
    }).json()
    print('JSON Query Status:', q_json['status'])
    assert q_json['status'] == 'SUCCESS'
    assert 'LaserCutter Ultra 900' in q_json['citations'][0]['manual_name']

    print('\n' + '=' * 60)
    print('SUCCESS: ALL UPLOAD & DYNAMIC RAG QUERYING VERIFIED!')
    print('=' * 60)

if __name__ == '__main__':
    run_test()