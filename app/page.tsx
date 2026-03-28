"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { supabase } from "@/utils/supabase";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-video bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-500">Starting camera...</p>
      </div>
    ),
  },
);

export default function App() {
  const [scanned, setScanned] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkin, setCheckin] = useState(true);

  const handleScan = async (results: any) => {
    if (results.length === 0 || loading) return;

    const id = results[0].rawValue.trim();
    setSuccess("");
    setError("");
    setScanned(id);
    setPaused(true);
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        checkin ? "admin_check_in_user" : "admin_mark_eaten",
        { target_id: id },
      );

      if (rpcError) {
        setError(rpcError.message);
      } else if (data) {
        setSuccess(data.toString());
      }
    } catch (err: any) {
      setError(err?.message ?? "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScanned(null);
    setPaused(false);
    setSuccess("");
    setError("");
  };

  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-center">Scanner Login</h1>
          <input
            type="password"
            placeholder="Enter password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (pw === process.env.NEXT_PUBLIC_SCANNER_PASSWORD) {
                  setAuthed(true);
                } else {
                  setPwError(true);
                }
              }
            }}
            className="border rounded-xl px-4 py-3 outline-none"
          />
          {pwError && (
            <p className="text-red-500 text-sm text-center">
              Incorrect password
            </p>
          )}
          <button
            onClick={() => {
              if (pw === process.env.NEXT_PUBLIC_SCANNER_PASSWORD) {
                setAuthed(true);
              } else {
                setPwError(true);
              }
            }}
            className="bg-blue-600 text-white rounded-xl py-3 font-semibold"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 flex flex-col gap-6">
      <h1 className="text-3xl md:text-5xl text-center">B4G QRCode Scanner</h1>

      <div>
        <button
          className={`${checkin ? "bg-(--pink) text-white" : "bg-(--container-background)"} p-3 rounded-l-xl`}
          onClick={() => setCheckin(true)}
        >
          Check-in
        </button>
        <button
          className={`${checkin ? "bg-(--container-background)" : "bg-(--pink) text-white"} p-3 rounded-r-xl`}
          onClick={() => setCheckin(false)}
        >
          Food
        </button>
      </div>

      <div className="overflow-clip rounded-2xl w-full">
        <Scanner
          onScan={handleScan}
          paused={paused}
          scanDelay={100}
          formats={["qr_code"]}
          constraints={{
            facingMode: "environment",
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
          }}
        />
      </div>

      {loading && (
        <p className="text-center text-gray-500 animate-pulse">Loading...</p>
      )}

      {success && (
        <h1 className="text-3xl md:text-5xl text-green-600 text-center">
          {success}
        </h1>
      )}

      {error && (
        <h1 className="text-3xl md:text-5xl text-red-600 text-center">
          {error}
        </h1>
      )}

      {scanned && !loading && (
        <button
          className="mx-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xl hover:bg-blue-700 transition"
          onClick={handleReset}
        >
          Scan Again
        </button>
      )}
    </div>
  );
}
