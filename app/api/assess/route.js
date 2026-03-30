"use client";
import { useState } from 'react';

export default function LeadershipEngine() {
  const [profile, setProfile] = useState({ role: 'Product Manager', level: 'Senior', industry: 'SaaS' });
  const [focusArea, setFocusArea] = useState('Prioritization');
  const [scenario, setScenario] = useState(null);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [currentPushback, setCurrentPushback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('profile'); // profile, generating, lab

  // NEW: Call the Generator
  async function handleStart() {
    setStep('generating');
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, focusArea })
      });
      const data = await res.json();
      setScenario(data);
      setStep('lab');
    } catch (e) {
      alert("Error generating scenario.");
      setStep('profile');
    }
    setLoading(false);
  }

  // (The handleAssess function remains mostly the same as the previous dynamic pushback version)
  async function handleAssess() {
    setLoading(true);
    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input, profile, scenario, chatHistory })
      });
      const data = await res.json();
      if (data.decision === "PUSHBACK") {
        setCurrentPushback(data.pushbackText);
        setChatHistory([...chatHistory, { role: 'user', text: input }, { role: 'model', text: data.pushbackText }]);
        setInput('');
      } else {
        setResult(data);
        setCurrentPushback(null);
      }
    } catch (e) { alert("Error."); }
    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {step === 'profile' && (
          <div style={styles.section}>
             <h1>Create Your Custom Lab</h1>
             <label style={styles.label}>Role & Level</label>
             <div style={{display:'flex', gap:'10px'}}>
                <select style={styles.input} onChange={e => setProfile({...profile, role: e.target.value})}>
                    <option>Product Manager</option>
                    <option>Engineering Leader</option>
                    <option>Founder/CEO</option>
                </select>
                <select style={styles.input} onChange={e => setProfile({...profile, level: e.target.value})}>
                    <option>Senior/Lead</option>
                    <option>Executive</option>
                </select>
             </div>

             <label style={styles.label}>What do you want to be tested on?</label>
             <textarea 
                style={{...styles.textarea, minHeight:'60px'}} 
                placeholder="e.g. Prioritization under pressure, Delivering bad news, Opinion forming..."
                value={focusArea}
                onChange={e => setFocusArea(e.target.value)}
             />
             <button style={styles.button} onClick={handleStart}>Generate Custom Scenario</button>
          </div>
        )}

        {step === 'generating' && (
            <div style={{textAlign:'center', padding:'40px'}}>
                <div className="loader"></div>
                <p>AI is analyzing your profile to build a high-stakes challenge...</p>
            </div>
        )}

        {step === 'lab' && scenario && (
          <div style={styles.section}>
            <div style={styles.scenarioBox}>
              <span style={styles.tag}>{focusArea}</span>
              <h3 style={{marginTop:'10px'}}>{scenario.headline}</h3>
              <p style={{fontStyle:'italic', color:'#94a3b8'}}>{scenario.stakeholderTitle}: "{scenario.context}"</p>
            </div>

            {currentPushback && (
              <div style={styles.pushbackBox}>
                <p><strong>{scenario.stakeholderTitle} pushback:</strong> "{currentPushback}"</p>
              </div>
            )}

            {!result ? (
              <>
                <textarea 
                  style={styles.textarea} 
                  placeholder="Your leadership move..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
                <button style={styles.button} onClick={handleAssess} disabled={loading}>
                  {loading ? "Typing..." : "Send Response"}
                </button>
              </>
            ) : (
              <div style={styles.resultArea}>
                <h2 style={{color: '#22c55e'}}>Simulation Complete</h2>
                <div style={styles.scoreGrid}>
                    {Object.entries(result.scores).map(([k,v]) => (
                        <div key={k} style={styles.scoreBox}><b>{v}</b><br/>{k}</div>
                    ))}
                </div>
                <p>{result.feedback}</p>
                <button style={styles.button} onClick={() => window.location.reload()}>Start New Custom Lab</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// (Styles remain largely the same, just ensure .loader CSS is added)
const styles = {
    // ... use previous styles ...
    container: { minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif' },
    card: { width: '100%', maxWidth: '600px', backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155', color: '#e2e8f0' },
    input: { width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '8px' },
    textarea: { width: '100%', minHeight: '100px', padding: '15px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '8px', marginBottom: '15px', fontSize: '15px' },
    button: { width: '100%', padding: '14px', backgroundColor: '#38bdf8', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    scenarioBox: { padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #38bdf8' },
    pushbackBox: { padding: '15px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #ef4444' },
    tag: { fontSize: '10px', padding: '3px 8px', backgroundColor: '#334155', borderRadius: '4px', textTransform: 'uppercase', color: '#38bdf8' },
    scoreGrid: { display: 'flex', gap: '10px', marginBottom: '20px' },
    scoreBox: { flex: 1, backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155', fontSize: '12px' }
};
