import React, { useState, useEffect, useRef } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import dart from 'react-syntax-highlighter/dist/esm/languages/prism/dart';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('dart', dart);
SyntaxHighlighter.registerLanguage('javascript', javascript);

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

function App() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [progLang, setProgLang] = useState("React (JSX)");
  const [uiLang, setUiLang] = useState("ar");
  const [theme, setTheme] = useState("light");
  const reportRef = useRef(null);
  
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('taqassi_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    localStorage.setItem('taqassi_history', JSON.stringify(history));
  }, [history]);

  const techStack = ["React (JSX)", "Flutter (Dart)", "JavaScript", "Python", "TypeScript", "Java", "Swift", "Kotlin", "C#", "PHP", "Go", "SQL"];

  const texts = {
    ar: { title: "تَقَصّي AI", subtitle: "إصدار المهندس حسن v9.5", placeholder: `الصق كود ${progLang} هنا يالبشمهندس...`, button: "بدء التقصّي", report: "تقرير المهندس (AI)", editor: "محرر الكود", empty: "بانتظار إبداعك يالبشمهندس حسن...", history: "السجل", clear: "مسح الكل", download: "تحميل PDF" },
    en: { title: "Taqassi AI", subtitle: "Hassan's Edition v9.5", placeholder: `Paste your ${progLang} code here, Hassan...`, button: "Analyze Code", report: "AI Analysis Report", editor: "Source Editor", empty: "Waiting for your input, Hassan...", history: "History", clear: "Clear All", download: "Download PDF" }
  };

  const t = texts[uiLang];
  const themes = {
    light: { bg: "bg-[#F8FAFC]", card: "bg-white", text: "text-slate-800", sub: "text-slate-400", border: "border-slate-200", input: "bg-slate-50", accent: "from-emerald-500 to-teal-400", codeStyle: oneLight },
    dark: { bg: "bg-[#0B0E14]", card: "bg-[#151921]", text: "text-slate-100", sub: "text-slate-500", border: "border-slate-800/50", input: "bg-[#1C222D]", accent: "from-indigo-600 to-blue-500", codeStyle: oneDark },
    ocean: { bg: "bg-[#0c2e4e]", card: "bg-[#0f3d68]", text: "text-sky-50", sub: "text-sky-300/50", border: "border-sky-800/50", input: "bg-[#0a2a47]", accent: "from-cyan-500 to-blue-400", codeStyle: oneDark }
  };

  const cur = themes[theme];

  const exportPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: theme === 'light' ? '#F8FAFC' : '#151921' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Taqassi_Report_Hassan_${Date.now()}.pdf`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(uiLang === 'ar' ? "تم نسخ الكود يالبشمهندس!" : "Code copied!");
  };

  const clearHistory = () => {
    if (window.confirm(uiLang === 'ar' ? "هل أنت متأكد من مسح السجل كاملاً؟" : "Are you sure?")) {
      setHistory([]);
    }
  };

  const startTaqassi = async () => {
    if (!code.trim()) return alert(uiLang === 'ar' ? "المربع فاضي!" : "Empty!");
    setLoading(true);
    setResult("");
    const sys = uiLang === "ar" 
      ? `أنت مهندس برمجيات محترف. التحقق هل الكود ينتمي لـ ${progLang}؟ 1. إذا لا: رد حصراً بتنبيه الخطأ. 2. إذا نعم: اشرح الخطأ بالعربية وقدم الحل.` 
      : `Expert Engineer. Verify ${progLang}. 1. If not: Reply error only. 2. If yes: Explain and fix.`;
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.1, messages: [{ role: "system", content: sys }, { role: "user", content: code }] })
      });
      const data = await response.json();
      const aiRes = data.choices[0].message.content;
      setResult(aiRes);
      if (!aiRes.includes("غير صحيحة") && !aiRes.includes("incorrect")) {
        setHistory(prev => [{ id: Date.now(), lang: progLang, code: code, result: aiRes }, ...prev.slice(0, 9)]);
      }
    } catch (err) { setResult(`Error: ${err.message}`); }
    setLoading(false);
  };

  const renderContent = (content) => {
    const codeBlockRegex = /```(?:[a-zA-Z0-9+#]+)?\n([\s\S]*?)\n```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) parts.push(<p key={lastIndex} className="mb-4">{content.substring(lastIndex, match.index)}</p>);
      const codeToCopy = match[1];
      parts.push(
        <div key={match.index} className="relative group rounded-2xl overflow-hidden my-6 border border-black/10 shadow-xl font-mono text-sm">
          <button onClick={() => copyToClipboard(codeToCopy)} className="absolute top-4 right-4 z-30 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all border border-white/20">📋</button>
          <SyntaxHighlighter language={progLang.toLowerCase().includes("react") ? "jsx" : progLang.toLowerCase().includes("flutter") ? "dart" : "javascript"} style={cur.codeStyle} customStyle={{ padding: '25px', margin: 0 }}>{codeToCopy}</SyntaxHighlighter>
        </div>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) parts.push(<p key={lastIndex}>{content.substring(lastIndex)}</p>);
    return parts;
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-500 ${cur.bg} ${cur.text}`} dir={uiLang === 'ar' ? 'rtl' : 'ltr'}>
      <aside className={`w-full md:w-20 md:hover:w-64 border-slate-200 flex md:flex-col items-center py-4 md:py-10 px-6 md:px-0 gap-4 md:gap-8 shadow-2xl z-20 ${cur.card} ${uiLang === 'ar' ? 'md:border-l' : 'md:border-r'} overflow-hidden transition-all duration-300 group`}>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${cur.accent} text-white shadow-lg shrink-0`}>🔍</div>
        <div className="flex flex-row md:flex-col gap-6 items-center w-full">
          <button onClick={() => setUiLang(uiLang === 'ar' ? 'en' : 'ar')} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl border font-bold text-[10px]">{uiLang === 'ar' ? 'EN' : 'AR'}</button>
          <button onClick={() => setTheme('light')} className={`w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl ${theme === 'light' ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-400' : 'opacity-40'}`}>☀️</button>
          <button onClick={() => setTheme('dark')} className={`w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300 ring-2 ring-indigo-500' : 'opacity-40'}`}>🌙</button>
          <button onClick={() => setTheme('ocean')} className={`w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl ${theme === 'ocean' ? 'bg-sky-800 text-sky-200 ring-2 ring-sky-400' : 'opacity-40'}`}>🌊</button>
          <div className="hidden md:flex flex-col gap-2 w-full mt-4 px-2 opacity-0 group-hover:opacity-100 transition-opacity overflow-y-auto max-h-[400px] custom-scrollbar">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-[15px] font-black uppercase opacity-40">{t.history}</span>
              {history.length > 0 && <button onClick={clearHistory} className="text-[12px] text-red-500 font-bold">{t.clear}</button>}
            </div>
            {history.map(item => (
              <button key={item.id} onClick={() => { setCode(item.code); setResult(item.result); setProgLang(item.lang); }} className={`w-full p-3 rounded-xl text-[9px] font-bold text-right ${cur.input} border hover:border-emerald-500 transition-all flex flex-col gap-1`}>
                <span className="text-emerald-500 text-[12px] uppercase">{item.lang}</span>
                <span className="truncate opacity-70 italic">{item.code.substring(0, 20)}...</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col p-4 md:p-10 gap-6 overflow-x-hidden">
        <header className={`flex flex-col md:flex-row justify-between items-center p-6 rounded-[2.5rem] shadow-sm border gap-4 ${cur.card} ${cur.border}`}>
          <div className="text-center md:text-right"><h1 className="text-xl md:text-2xl font-black">{t.title}</h1><p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t.subtitle}</p></div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <select value={progLang} onChange={(e) => setProgLang(e.target.value)} className={`w-full md:w-auto text-xs rounded-2xl px-5 py-3 outline-none font-bold border ${cur.input}`}>{techStack.map(l => <option key={l} value={l}>{l}</option>)}</select>
            <button onClick={startTaqassi} disabled={loading} className={`w-full md:w-auto px-10 py-4 bg-gradient-to-r ${cur.accent} text-white rounded-2xl font-black shadow-xl active:scale-95 disabled:grayscale min-w-[150px] flex items-center justify-center`}>{loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : t.button}</button>
          </div>
        </header>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          <div className="flex flex-col gap-2 min-h-[300px] md:min-h-0"><span className="text-[10px] font-black px-5 uppercase opacity-50">{t.editor} ({progLang})</span><textarea className={`flex-1 rounded-[2.5rem] p-8 border shadow-sm outline-none font-mono text-sm resize-none ${cur.card} ${cur.border} custom-scrollbar`} placeholder={t.placeholder} value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <div className="flex flex-col gap-2 min-h-[300px] md:min-h-0 relative">
            <div className="flex justify-between items-center px-5">
              <span className="text-[10px] font-black uppercase opacity-50">{t.report}</span>
              {result && <button onClick={exportPDF} className={`text-[10px] font-black px-4 py-1 rounded-full bg-gradient-to-r ${cur.accent} text-white shadow-md active:scale-95 transition-all uppercase`}>{t.download}</button>}
            </div>
            <div ref={reportRef} className={`flex-1 rounded-[3rem] border p-8 md:p-10 shadow-inner overflow-y-auto leading-relaxed ${cur.input} ${cur.border} custom-scrollbar`}>
              {result ? <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">{renderContent(result)}</div> : <div className="h-full flex flex-col items-center justify-center opacity-20 italic gap-4">🚀 <p className="text-[10px] uppercase font-bold">{t.empty}</p></div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;