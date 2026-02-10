"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

interface ColorMatch {
  id: string;
  name: string;
  hex: string;
  brandName: string;
  brandSlug: string;
  colorSlug: string;
  colorNumber: string | null;
  deltaE: number;
}

type Stage = "upload" | "pick" | "results";

export function ColorIdentifier() {
  const [stage, setStage] = useState<Stage>("upload");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [matches, setMatches] = useState<ColorMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      setStage("pick");
      setPickedColor(null);
      setMatches([]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleImageLoad = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Scale canvas to fit while preserving aspect ratio
    const maxW = canvas.parentElement?.clientWidth ?? 800;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.round(
        ((e.clientX - rect.left) / rect.width) * canvas.width,
      );
      const y = Math.round(
        ((e.clientY - rect.top) / rect.height) * canvas.height,
      );

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;

      setPickedColor(hex);
      setLoading(true);

      try {
        const res = await fetch(
          `/api/color-match?hex=${encodeURIComponent(hex)}`,
        );
        const data = await res.json();
        setMatches(data.matches ?? []);
        setStage("results");
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const resetToUpload = () => {
    setStage("upload");
    setImageSrc(null);
    setPickedColor(null);
    setMatches([]);
  };

  const resetToPick = () => {
    setStage("pick");
    setPickedColor(null);
    setMatches([]);
    // Redraw the image on canvas
    setTimeout(() => {
      handleImageLoad();
    }, 0);
  };

  return (
    <div className="mt-8">
      {/* Upload Stage */}
      {stage === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-blue-400 hover:bg-blue-50/30"
        >
          <svg
            className="mb-4 h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Drop an image here or click to upload
          </p>
          <p className="mb-4 text-xs text-gray-500">
            JPG, PNG, or any image format
          </p>
          <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Choose Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
        </div>
      )}

      {/* Pick Stage */}
      {stage === "pick" && imageSrc && (
        <div>
          <p className="mb-4 text-sm text-gray-600">
            Click anywhere on the image to sample a color.
          </p>
          {/* Hidden image element for loading */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt=""
            className="hidden"
            onLoad={handleImageLoad}
          />
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full max-w-3xl cursor-crosshair rounded-lg border border-gray-200"
          />
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Finding matches...
            </div>
          )}
          <button
            onClick={resetToUpload}
            className="mt-4 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            &larr; Upload different photo
          </button>
        </div>
      )}

      {/* Results Stage */}
      {stage === "results" && pickedColor && (
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-lg border border-gray-200"
                style={{ backgroundColor: pickedColor }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Sampled Color
                </p>
                <p className="font-mono text-sm text-gray-600">
                  {pickedColor.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetToPick}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Pick another spot
              </button>
              <button
                onClick={resetToUpload}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Upload different photo
              </button>
            </div>
          </div>

          {matches.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/colors/${match.brandSlug}/${match.colorSlug}`}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                >
                  <div
                    className="h-12 w-12 shrink-0 rounded-lg border border-gray-200"
                    style={{ backgroundColor: match.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {match.name}
                    </p>
                    <p className="text-sm text-gray-500">{match.brandName}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {match.hex.toUpperCase()} &middot; Delta E:{" "}
                      {match.deltaE.toFixed(2)}
                      {match.deltaE < 2
                        ? " (very close)"
                        : match.deltaE < 5
                          ? " (close)"
                          : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No close paint matches found for this color.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
