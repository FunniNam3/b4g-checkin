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

    // Fetch the profile first so we can give specific errors
    const { data: profile, error: fetchError } = await supabase
      .from("profile")
      .select("first_name, last_name, checked_in, has_eaten")
      .eq("id", id)
      .single();

    if (fetchError || !profile) {
      setError(`No profile found for ID: ${id}`);
      setLoading(false);
      return;
    }

    const name = `${profile.first_name} ${profile.last_name}`;

    if (checkin) {
      if (profile.checked_in) {
        setError(`${name} has already checked in.`);
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profile")
        .update({ checked_in: true })
        .eq("id", id);

      setLoading(false);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(`Successfully checked in ${name}`);
    } else {
      if (!profile.checked_in) {
        setError(`${name} has not checked in yet.`);
        setLoading(false);
        return;
      }

      if (profile.has_eaten) {
        setError(`${name} has already eaten.`);
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profile")
        .update({ has_eaten: true })
        .eq("id", id);

      setLoading(false);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(`Successfully marked ${name} as eaten`);
    }
  };

  const handleReset = () => {
    setScanned(null);
    setPaused(false);
    setSuccess("");
    setError("");
  };

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
