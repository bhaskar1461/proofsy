"use client";

import React, { useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { LeftSidebar } from "../components/panels/LeftSidebar";
import { CertificateCanvas } from "../components/canvas/CertificateCanvas";
import { InspectorPanel } from "../components/panels/InspectorPanel";
import { ReconstructionReportModal } from "../components/modals/ReconstructionReportModal";
import { CertificatePreviewModal } from "../components/preview/CertificatePreviewModal";
import { AgentIntegrationModal } from "../components/modals/AgentIntegrationModal";
import { useDesignerStore } from "../store/useDesignerStore";

export default function DesignerPage() {
  const { template } = useDesignerStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Application Bar */}
      <TopBar
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenAgentModal={() => setIsAgentModalOpen(true)}
      />

      {/* Main Designer Canvas & Tool Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbox & Layer Tree */}
        <LeftSidebar />

        {/* Center Interactive Certificate Canvas */}
        <CertificateCanvas />

        {/* Right Element Inspector & Typography Panel */}
        <InspectorPanel />
      </div>

      {/* Modals */}
      <ReconstructionReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      <CertificatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      <AgentIntegrationModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        template={template}
      />
    </main>
  );
}
