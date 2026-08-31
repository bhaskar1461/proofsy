"use client";

import React, { useState } from "react";
import { ProofsyTemplate } from "@/types/designer/template";
import {
  Terminal,
  Key,
  Bot,
  Copy,
  Check,
  X,
  Code2,
  ExternalLink,
  Sparkles,
  Cpu,
  Download,
} from "lucide-react";

interface AgentIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ProofsyTemplate;
}

export const AgentIntegrationModal: React.FC<AgentIntegrationModalProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  const [activeTab, setActiveTab] = useState<"ssh" | "cli" | "ai" | "python">("ssh");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sample data variables detected in current template
  const variableMap: Record<string, string> = {};
  template.elements
    .filter((el) => el.type === "variable_text" && el.variableKey)
    .forEach((el) => {
      variableMap[el.variableKey!] = el.fallbackText || "Sample Value";
    });

  if (Object.keys(variableMap).length === 0) {
    variableMap["recipient_name"] = "Jane Doe";
    variableMap["date"] = "August 15, 2026";
    variableMap["verification_code"] = "PROOF-2026-X89K9";
  }

  const sampleDataJson = JSON.stringify(variableMap, null, 2);

  // 1. SSH Command
  const sshTunnelCmd = `ssh -p 2222 -L 3001:localhost:3001 -L 5000:localhost:5000 -i ~/.ssh/vm_assistant_key ubuntu@192.168.0.6`;
  const sshDirectCmd = `ssh -p 2222 ubuntu@192.168.0.6`;

  // 2. Direct CLI Command
  const cliNodeCmd = `node cli/proofsy-render.js --template template.json --data '${JSON.stringify(variableMap)}' --out output.pdf`;
  const cliRemoteSshCmd = `ssh -p 2222 ubuntu@192.168.0.6 "node /home/ubuntu/projects/proofsy/cli/proofsy-render.js --template /home/ubuntu/projects/proofsy/template.json --data '${JSON.stringify(variableMap)}' --out /tmp/certificate.pdf"`;

  // 3. AI Agent (Antigravity / Claude Code) Instruction
  const aiAgentPrompt = `You are connected to the Proofsy Certificate Engine.
Generate a high-resolution PDF certificate using the template "${template.name}":

Template JSON: template.json
Recipient Data:
${sampleDataJson}

Execute:
node cli/proofsy-render.js --template template.json --data '${JSON.stringify(variableMap)}' --out ./output_certificate.pdf`;

  // 4. Python SDK Script
  const pythonScript = `import urllib.request
import json

# Render & Issue Certificate via Proofsy Engine
API_URL = "http://localhost:5000/api/templates/import"

payload = {
    "name": "${template.name}",
    "schemaVersion": "2.0",
    "templateJson": ${JSON.stringify(template, null, 2)}
}

req = urllib.request.Request(
    API_URL,
    data=json.dumps(payload).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)

response = urllib.request.urlopen(req)
result = json.loads(response.read().decode('utf-8'))
print(f"✓ Template live in Proofsy! ID: {result.get('data', {}).get('_id')}")
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">AI Agent, IDE & SSH Integration</h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Ready for Agents
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connect Antigravity, Claude Code, Cursor, or run terminal CLI commands to generate PDFs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab("ssh")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
              activeTab === "ssh"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="h-4 w-4" />
            <span>SSH Key & Remote Tunnel</span>
          </button>
          <button
            onClick={() => setActiveTab("cli")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
              activeTab === "cli"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>CMD / Terminal Generator</span>
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
              activeTab === "ai"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>AI Agent Prompt (Claude / Antigravity)</span>
          </button>
          <button
            onClick={() => setActiveTab("python")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
              activeTab === "python"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>Python / Node Automation</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. SSH TAB */}
          {activeTab === "ssh" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    1. SSH Secure Tunnel (Access Editor from any Machine)
                  </span>
                  <button
                    onClick={() => handleCopy(sshTunnelCmd, "sshTunnel")}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    {copiedKey === "sshTunnel" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === "sshTunnel" ? "Copied!" : "Copy Command"}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-indigo-300">
                  {sshTunnelCmd}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-300">SSH Connection Details</span>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li><strong className="text-slate-200">Host:</strong> 192.168.0.6 (or 127.0.0.1)</li>
                    <li><strong className="text-slate-200">SSH Port:</strong> 2222</li>
                    <li><strong className="text-slate-200">User:</strong> ubuntu</li>
                    <li><strong className="text-slate-200">Password:</strong> ubuntu</li>
                    <li><strong className="text-slate-200">SSH Key:</strong> C:\Users\bhask\.ssh\vm_assistant_key</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-300">Remote IDE Setup (VS Code / Cursor)</span>
                  <p className="text-xs text-slate-400">
                    Open VS Code, press <kbd className="rounded bg-slate-800 px-1 py-0.5 text-slate-300">Ctrl+Shift+P</kbd>, select <strong>Remote-SSH: Connect to Host</strong> and enter:
                  </p>
                  <pre className="rounded-lg bg-slate-900 p-2 font-mono text-[11px] text-indigo-300">
                    ssh -p 2222 ubuntu@192.168.0.6
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* 2. CLI TAB */}
          {activeTab === "cli" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Direct Terminal CMD (Generates PDF instantly)
                  </span>
                  <button
                    onClick={() => handleCopy(cliNodeCmd, "cliNode")}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    {copiedKey === "cliNode" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === "cliNode" ? "Copied!" : "Copy CMD"}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-300">
                  {cliNodeCmd}
                </pre>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Remote 1-Line SSH Execution from Any Machine
                  </span>
                  <button
                    onClick={() => handleCopy(cliRemoteSshCmd, "cliSsh")}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    {copiedKey === "cliSsh" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === "cliSsh" ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-indigo-300">
                  {cliRemoteSshCmd}
                </pre>
              </div>
            </div>
          )}

          {/* 3. AI AGENT TAB */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Paste this into Antigravity or Claude Code:
                  </span>
                  <button
                    onClick={() => handleCopy(aiAgentPrompt, "aiPrompt")}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
                  >
                    {copiedKey === "aiPrompt" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === "aiPrompt" ? "Copied Prompt!" : "Copy AI Prompt"}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                  {aiAgentPrompt}
                </pre>
              </div>
            </div>
          )}

          {/* 4. PYTHON TAB */}
          {activeTab === "python" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Python Script (Auto-Import & Generate)
                  </span>
                  <button
                    onClick={() => handleCopy(pythonScript, "pyScript")}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    {copiedKey === "pyScript" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === "pyScript" ? "Copied!" : "Copy Python Code"}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-amber-300">
                  {pythonScript}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Works out-of-the-box with Antigravity IDE, Claude Code, Cursor, and Bash/PowerShell.</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
