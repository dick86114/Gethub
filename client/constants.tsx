import React from 'react';

export const MOCK_ANALYSIS = {
  coreSummary: "等待 AI 分析... (请在设置中配置您的 Gemini API 密钥)",
  features: ["正在分析代码结构...", "正在阅读文档...", "正在识别技术栈..."],
  useCases: ["开发工具", "学习资源", "自动化流程"]
};

// Simple Icon wrapper for consistent sizing
export const Icon = ({ name, className = "", fill = false }: { name: string, className?: string, fill?: boolean }) => (
  <span className={`material-symbols-outlined ${fill ? 'material-fill' : ''} ${className}`}>
    {name}
  </span>
);
