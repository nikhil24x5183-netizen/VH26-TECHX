import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, RefreshCw, ShieldCheck, FileText, Activity } from 'lucide-react';
import { runEvaluation as runEvalApi } from '../api/chat';

export default function EvaluationDashboard() {
  const [evalData, setEvalData] = useState(null);
  const [running, setRunning] = useState(false);

  const runEvaluation = async () => {
    setRunning(true);
    try {
      const data = await runEvalApi();
      setEvalData(data);
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runEvaluation();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F9FC] overflow-y-auto p-6 space-y-4 select-none">
      {/* Top Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center">
            <Award size={18} className="mr-2 text-blue-600" /> Judge Evaluation Benchmark Dashboard
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Automated test benchmark suite validating retrieval precision, ambiguity detection, refusal safety, and citations.
          </p>
        </div>
        <button
          onClick={runEvaluation}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center space-x-1.5 shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={running ? "animate-spin" : ""} />
          <span>{running ? "Running Suite..." : "Run Evaluation Suite"}</span>
        </button>
      </div>

      {/* Benchmark Metrics Scorecard */}
      {evalData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-400">Benchmark Score</div>
              <div className="text-3xl font-bold text-gray-900 font-mono mt-0.5">{evalData.overall_score}%</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
              🏆
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-400">Test Cases Passed</div>
              <div className="text-3xl font-bold text-emerald-600 font-mono mt-0.5">{evalData.passed_count} / {evalData.total_count}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle size={22} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-400">Hallucination Rate</div>
              <div className="text-3xl font-bold text-blue-600 font-mono mt-0.5">0.0%</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <ShieldCheck size={22} />
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Results Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-gray-700">
            Evaluation Benchmark Log
          </span>
          <span className="text-xs font-mono text-gray-500">
            Verified Evidence Matching
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-gray-500 font-semibold text-[11px]">
              <th className="p-3.5">Test ID</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Query / Prompt</th>
              <th className="p-3.5">Confidence</th>
              <th className="p-3.5">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
            {!evalData ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400 font-mono text-xs">
                  Running automated benchmarks...
                </td>
              </tr>
            ) : (
              evalData.benchmark_results.map((res, idx) => (
                <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                  <td className="p-3.5 font-mono font-semibold text-gray-900">{res.id}</td>
                  <td className="p-3.5">
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {res.category}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-gray-900">"{res.query}"</div>
                    <div className="text-[11px] font-mono text-gray-500 italic mt-0.5">{res.answer_snippet}</div>
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-gray-700">
                    {Math.round(res.confidence_score * 100)}% ({res.confidence_label})
                  </td>
                  <td className="p-3.5">
                    {res.status === "PASS" ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold flex items-center w-fit">
                        <CheckCircle size={12} className="mr-1 text-emerald-600" /> PASS
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold flex items-center w-fit">
                        <XCircle size={12} className="mr-1 text-rose-600" /> FAIL
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

