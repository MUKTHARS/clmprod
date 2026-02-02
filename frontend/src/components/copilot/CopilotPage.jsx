import React from 'react';
import { Sparkles } from 'lucide-react';

function CopilotPage() {
  return (
    <div className="copilot-page" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* <div className="copilot-page-header">
        <Sparkles size={20} />
        <h3>AI Copilot</h3>
      </div> */}
      
      <iframe
        src="https://bot.saple.ai/c714f67a-7a32-4c05-92f6-2c288504c653/c480dae5-8369-4283-9ca2-3615ed64716b"
        title="AI Copilot Assistant"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          backgroundColor: 'white'
        }}
        frameBorder="0"
        allow="microphone; camera"
        allowFullScreen
      />
    </div>
  );
}

export default CopilotPage;